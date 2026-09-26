import { createHash } from "crypto";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { ZodType } from "zod";
import type { AiAnalysisStatus } from "@/types";

/**
 * Server-Side Gemini AI Client
 * Strictly server-side: Never exposed to client components.
 *
 * Every AI feature goes through `generateJson()` so that timeouts, rate limits (429), provider
 * overload (503), model fallback and schema validation behave identically everywhere. Before this
 * existed each agent swallowed errors in a bare `catch {}`, so a quota or timeout failure in
 * production silently degraded every request to the deterministic fallback with no signal.
 */

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  return geminiClient;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

const DEFAULT_PRIMARY_MODEL = "gemini-3.6-flash";
// Tried in order when the primary model is rate-limited (each model has its own quota bucket),
// overloaded, or unavailable.
const DEFAULT_FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

function parseModelList(raw: string | undefined): string[] {
  return (raw || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

/** Ordered, de-duplicated model chain. `GEMINI_MODEL` / `GEMINI_FALLBACK_MODELS` override defaults. */
export function getGeminiModelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_PRIMARY_MODEL;
  const fallbacksFromEnv = parseModelList(process.env.GEMINI_FALLBACK_MODELS);
  const fallbacks = fallbacksFromEnv.length > 0 ? fallbacksFromEnv : DEFAULT_FALLBACK_MODELS;
  return Array.from(new Set([primary, ...fallbacks]));
}

export const GEMINI_CONFIG = {
  get defaultModel(): string {
    return getGeminiModelChain()[0];
  },
  get reasoningModel(): string {
    return getGeminiModelChain()[0];
  },
  temperature: 0.2, // Low temperature for high precision and grounded legal analysis
  maxOutputTokens: 8192,
};

/** One provider attempt, recorded for observability. */
export interface AiCallRecord {
  label: string;
  model: string;
  ok: boolean;
  ms: number;
  error?: string;
}

/**
 * Per-request telemetry. Created by an orchestrator and threaded through the agents so the final
 * response can state honestly whether live AI actually contributed (see `AiAnalysisStatus`).
 */
export class AiRunTracker {
  readonly calls: AiCallRecord[] = [];

  record(call: AiCallRecord): void {
    this.calls.push(call);
  }

  summarize(): AiAnalysisStatus {
    const succeeded = this.calls.filter((c) => c.ok);
    const failed = this.calls.filter((c) => !c.ok);
    const labelsOk = new Set(succeeded.map((c) => c.label));
    const labelsAll = new Set(this.calls.map((c) => c.label));
    const configured = isGeminiConfigured();

    let mode: AiAnalysisStatus["mode"];
    if (!configured) mode = "deterministic";
    else if (labelsAll.size === 0) mode = "deterministic";
    else if (labelsOk.size === 0) mode = "deterministic";
    else if (labelsOk.size < labelsAll.size) mode = "partial";
    else mode = "live";

    return {
      mode,
      configured,
      succeededSteps: Array.from(labelsOk),
      failedSteps: Array.from(labelsAll).filter((l) => !labelsOk.has(l)),
      models: Array.from(new Set(succeeded.map((c) => c.model))),
      errors: Array.from(new Set(failed.map((c) => c.error || "unknown"))).slice(0, 5),
    };
  }
}

export type { AiAnalysisStatus };

export interface GenerateJsonOptions<T> {
  /** Short stable name, e.g. "extraction". Used for telemetry and logs. */
  label: string;
  contents: string;
  systemInstruction?: string;
  schema: ZodType<T>;
  temperature?: number;
  maxOutputTokens?: number;
  /** Wall-clock budget across ALL attempts. Default 30s. */
  totalTimeoutMs?: number;
  /** Cap for a single provider attempt. Default 20s. */
  attemptTimeoutMs?: number;
  tracker?: AiRunTracker;
}

export type GenerateJsonResult<T> =
  | { ok: true; data: T; model: string }
  | { ok: false; reason: string };

interface ErrorInfo {
  status?: number;
  message: string;
  retryAfterMs?: number;
  isTimeout: boolean;
  /** 429 caused by a per-day quota (resets daily, so retrying soon is pointless). */
  isDailyQuota?: boolean;
}

function describeError(err: unknown): ErrorInfo {
  const anyErr = err as { status?: number; code?: number; message?: unknown; name?: string };
  const message = typeof anyErr?.message === "string" ? anyErr.message : String(err);
  const isTimeout =
    anyErr?.name === "AbortError" ||
    anyErr?.name === "TimeoutError" ||
    /aborted|timed? ?out/i.test(message);
  const status =
    typeof anyErr?.status === "number"
      ? anyErr.status
      : typeof anyErr?.code === "number"
      ? anyErr.code
      : undefined;
  const retryMatch = message.match(/retry in ([\d.]+)s/i) || message.match(/"retryDelay":\s*"([\d.]+)s"/i);
  const retryAfterMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) : undefined;
  const isDailyQuota = /PerDay|per day/i.test(message);
  return { status, message: message.replace(/\s+/g, " ").slice(0, 200), retryAfterMs, isTimeout, isDailyQuota };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strips ```json fences some models emit even when a JSON mime type is requested. */
export function parseJsonLoose(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

// Models that rejected a thinking configuration; we stop sending it to them.
const modelsWithoutThinkingSupport = new Set<string>();

/**
 * Circuit breaker. When every model in the chain just failed for provider-side reasons (quota,
 * overload, timeout), further calls in the next few seconds fail immediately instead of each
 * burning their own full timeout. One analysis makes several sequential AI calls; without this a
 * provider outage would stack their timeouts past the serverless function limit.
 */
const PROVIDER_COOLDOWN_MS = 20_000;
let providerCooldownUntil = 0;

/**
 * Quota savers (per server instance, best-effort):
 *  - Identical requests (same step, prompt and settings) reuse a recent successful answer, and
 *    concurrent duplicates share a single provider call. Re-running the same document, question
 *    or negotiation, or React's dev-mode double request, no longer spends quota twice.
 *  - A model that answered "quota exceeded" is skipped for a while instead of being hit again on
 *    every call; the chain goes straight to the next model with its own quota bucket.
 */
const RESPONSE_CACHE_TTL_MS = 6 * 60 * 60_000;
const RESPONSE_CACHE_MAX_ENTRIES = 200;
const responseCache = new Map<string, { data: unknown; model: string; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<GenerateJsonResult<unknown>>>();

const MODEL_QUOTA_COOLDOWN_MIN_MS = 60_000;
const MODEL_QUOTA_COOLDOWN_MAX_MS = 30 * 60_000;
const modelCooldownUntil = new Map<string, number>();

function quotaCooldownMs(info: ErrorInfo): number {
  if (info.isDailyQuota) return MODEL_QUOTA_COOLDOWN_MAX_MS;
  const requested = info.retryAfterMs ?? MODEL_QUOTA_COOLDOWN_MIN_MS;
  return Math.min(Math.max(requested, MODEL_QUOTA_COOLDOWN_MIN_MS), MODEL_QUOTA_COOLDOWN_MAX_MS);
}

function requestCacheKey<T>(opts: GenerateJsonOptions<T>): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        opts.label,
        opts.systemInstruction ?? "",
        opts.contents,
        opts.temperature ?? null,
        opts.maxOutputTokens ?? null,
      ])
    )
    .digest("hex");
}

/** Test hook. Also clears the response cache and per-model quota cooldowns. */
export function resetGeminiCircuitBreaker(): void {
  providerCooldownUntil = 0;
  modelCooldownUntil.clear();
  responseCache.clear();
  inFlightRequests.clear();
}

/**
 * Calls Gemini and returns schema-validated JSON, or an explicit failure reason.
 * Never throws: callers decide how to degrade (and the tracker records why).
 * Successful answers are cached briefly; failures are never cached.
 */
export async function generateJson<T>(opts: GenerateJsonOptions<T>): Promise<GenerateJsonResult<T>> {
  if (!getGeminiClient()) {
    return { ok: false, reason: "GEMINI_API_KEY is not configured" };
  }

  const key = requestCacheKey(opts);
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    // Re-insert to keep recently used entries at the end (LRU eviction order).
    responseCache.delete(key);
    responseCache.set(key, cached);
    opts.tracker?.record({ label: opts.label, model: cached.model, ok: true, ms: 0 });
    return { ok: true, data: structuredClone(cached.data) as T, model: cached.model };
  }
  if (cached) responseCache.delete(key);

  const pending = inFlightRequests.get(key);
  if (pending) {
    const shared = await pending;
    if (!shared.ok) {
      opts.tracker?.record({ label: opts.label, model: "-", ok: false, ms: 0, error: shared.reason });
      return shared;
    }
    opts.tracker?.record({ label: opts.label, model: shared.model, ok: true, ms: 0 });
    return { ok: true, data: structuredClone(shared.data) as T, model: shared.model };
  }

  const call = generateJsonUncached(opts);
  inFlightRequests.set(key, call);
  try {
    const result = await call;
    if (result.ok) {
      responseCache.set(key, {
        data: structuredClone(result.data),
        model: result.model,
        expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS,
      });
      while (responseCache.size > RESPONSE_CACHE_MAX_ENTRIES) {
        const oldest = responseCache.keys().next().value;
        if (oldest === undefined) break;
        responseCache.delete(oldest);
      }
    }
    return result;
  } finally {
    inFlightRequests.delete(key);
  }
}

async function generateJsonUncached<T>(opts: GenerateJsonOptions<T>): Promise<GenerateJsonResult<T>> {
  const gemini = getGeminiClient();
  if (!gemini) {
    return { ok: false, reason: "GEMINI_API_KEY is not configured" };
  }

  if (Date.now() < providerCooldownUntil) {
    const reason = "skipped: Gemini provider recently unavailable (cooling down)";
    opts.tracker?.record({ label: opts.label, model: "-", ok: false, ms: 0, error: reason });
    return { ok: false, reason };
  }

  const now = Date.now();
  const modelChain = getGeminiModelChain().filter((m) => (modelCooldownUntil.get(m) ?? 0) <= now);
  if (modelChain.length === 0) {
    const reason = "skipped: every Gemini model is over quota (cooling down)";
    opts.tracker?.record({ label: opts.label, model: "-", ok: false, ms: 0, error: reason });
    return { ok: false, reason };
  }

  const started = Date.now();
  const totalBudget = opts.totalTimeoutMs ?? 30_000;
  const attemptCap = opts.attemptTimeoutMs ?? 20_000;
  const remaining = () => totalBudget - (Date.now() - started);
  const failures: string[] = [];

  for (const model of modelChain) {
    // At most two tries per model: the second one only after a short, explicitly-requested delay
    // or a transient provider error.
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (remaining() < 1500) {
        return finishFailure(opts, failures, "time budget exhausted");
      }

      const callStarted = Date.now();
      const useThinking = !modelsWithoutThinkingSupport.has(model);

      try {
        const response = await gemini.models.generateContent({
          model,
          contents: opts.contents,
          config: {
            systemInstruction: opts.systemInstruction,
            temperature: opts.temperature ?? GEMINI_CONFIG.temperature,
            maxOutputTokens: opts.maxOutputTokens ?? GEMINI_CONFIG.maxOutputTokens,
            responseMimeType: "application/json",
            abortSignal: AbortSignal.timeout(Math.min(attemptCap, remaining())),
            // Structured extraction does not benefit from long hidden reasoning, and on the
            // default setting a trivial call took ~11s. Keep it short to stay inside serverless limits.
            ...(useThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
          },
        });

        const text = response.text?.trim();
        if (!text) {
          throw new Error(
            `empty response (finishReason=${response.candidates?.[0]?.finishReason ?? "unknown"})`
          );
        }

        const parsedJson = parseJsonLoose(text);
        const validated = opts.schema.safeParse(parsedJson);
        if (!validated.success) {
          throw new SchemaMismatchError(validated.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
        }

        opts.tracker?.record({ label: opts.label, model, ok: true, ms: Date.now() - callStarted });
        return { ok: true, data: validated.data, model };
      } catch (err) {
        const info = err instanceof SchemaMismatchError
          ? { status: undefined, message: `schema mismatch: ${err.message}`, retryAfterMs: undefined, isTimeout: false }
          : describeError(err);
        const summary = `${model}: ${info.status ?? (info.isTimeout ? "timeout" : "error")} ${info.message}`.slice(0, 240);
        failures.push(summary);
        opts.tracker?.record({ label: opts.label, model, ok: false, ms: Date.now() - callStarted, error: summary });
        console.error(`[gemini:${opts.label}] ${summary}`);

        // Thinking config rejected → remember and retry the same model immediately without it.
        if (info.status === 400 && useThinking && /think/i.test(info.message)) {
          modelsWithoutThinkingSupport.add(model);
          attempt--; // does not count as a real attempt
          continue;
        }

        // Key problems will not be fixed by another model.
        if (info.status === 401 || info.status === 403) {
          return finishFailure(opts, failures, "authentication/permission error");
        }

        // Rate limited: wait only if the provider says it is brief; otherwise rest this model for a
        // while (so later calls skip it) and try the next one.
        if (info.status === 429) {
          if (attempt === 1 && info.retryAfterMs !== undefined && info.retryAfterMs <= 4000 && remaining() > info.retryAfterMs + 4000) {
            await sleep(info.retryAfterMs + 250);
            continue;
          }
          modelCooldownUntil.set(model, Date.now() + quotaCooldownMs(info));
          break;
        }

        // Transient provider errors / timeouts / malformed output: one quick retry, then next model.
        const transient =
          info.isTimeout ||
          info.status === 500 ||
          info.status === 502 ||
          info.status === 503 ||
          info.status === 504 ||
          err instanceof SchemaMismatchError ||
          info.status === undefined;
        if (transient && attempt === 1 && !info.isTimeout && remaining() > 6000) {
          await sleep(400);
          continue;
        }
        break; // 404 (model gone), 400, exhausted retries → next model
      }
    }
  }

  return finishFailure(opts, failures, "all models failed");
}

class SchemaMismatchError extends Error {}

function finishFailure<T>(
  opts: GenerateJsonOptions<T>,
  failures: string[],
  why: string
): GenerateJsonResult<T> {
  const reason = `${why}${failures.length ? ` (${failures[failures.length - 1]})` : ""}`;
  console.error(`[gemini:${opts.label}] giving up: ${reason}`);
  // Only trip the breaker for provider-side failures, never for our own schema mismatches.
  if (failures.length > 0 && failures.every((f) => !/schema mismatch|empty response/.test(f))) {
    providerCooldownUntil = Date.now() + PROVIDER_COOLDOWN_MS;
  }
  return { ok: false, reason };
}
