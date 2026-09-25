import { NextRequest, NextResponse } from "next/server";
import type { AnalysisReport, Clause, DocumentMetadata, EvidenceChain, Finding } from "@/types";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { getAnalysisReportById, getCachedAnalysisReport } from "@/lib/storage/reportStore";
import { generateNegotiationPlan } from "@/lib/ai/agents/negotiationAgent";
import {
  buildNegotiationInputFromReport,
  isNegotiableSeverity,
  type NegotiationEngineInput,
} from "@/lib/negotiation/negotiationEngine";
import { checkRateLimit } from "@/lib/safety/rateLimiter";
import { isDeclaredContentLengthTooLarge } from "@/lib/documents/fileValidator";

const MAX_REQUEST_BODY_BYTES = 512 * 1024;
const MAX_ID_LENGTH = 200;

interface NegotiateClientContext {
  finding?: Finding;
  clause?: Clause | null;
  evidenceChain?: EvidenceChain | null;
  documentType?: DocumentMetadata["documentType"];
  parties?: DocumentMetadata["parties"];
  jurisdiction?: string | null;
}

async function resolveReport(reportId: string): Promise<AnalysisReport | null> {
  if (
    reportId === "demo-employment-agreement" ||
    reportId === "demo-commercial-lease" ||
    reportId === SAMPLE_ANALYSIS_REPORT.id
  ) {
    return SAMPLE_ANALYSIS_REPORT;
  }
  return getCachedAnalysisReport(reportId) || (await getAnalysisReportById(reportId));
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_ID_LENGTH;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, "negotiate", 20, 60_000);
    if (rateLimit.limited) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    if (isDeclaredContentLengthTooLarge(req, MAX_REQUEST_BODY_BYTES)) {
      return NextResponse.json({ success: false, error: "Request body is too large." }, { status: 413 });
    }

    const body = await req.json();
    const {
      reportId,
      findingId,
      clientContext,
    }: { reportId?: unknown; findingId?: unknown; clientContext?: NegotiateClientContext } = body || {};

    if (!isValidId(reportId) || !isValidId(findingId)) {
      return NextResponse.json(
        { success: false, error: "A valid reportId and findingId are required." },
        { status: 400 }
      );
    }

    // Prefer the server's own copy of the report so grounding cannot be altered by the client;
    // fall back to the client's local-first copy for reports that only exist in the browser.
    const report = await resolveReport(reportId);
    let input: NegotiationEngineInput | null = report
      ? buildNegotiationInputFromReport(report, findingId)
      : null;

    if (!input && clientContext?.finding && clientContext.finding.id === findingId) {
      input = {
        documentId: reportId,
        finding: clientContext.finding,
        clause: clientContext.clause || null,
        evidenceChain: clientContext.evidenceChain || null,
        documentType: clientContext.documentType,
        parties: Array.isArray(clientContext.parties) ? clientContext.parties.slice(0, 10) : [],
        jurisdiction: typeof clientContext.jurisdiction === "string" ? clientContext.jurisdiction : null,
      };
    }

    if (!input) {
      return NextResponse.json(
        { success: false, error: "That finding could not be found in this analysis." },
        { status: 404 }
      );
    }

    if (!isNegotiableSeverity(input.finding.severity)) {
      return NextResponse.json(
        {
          success: false,
          error: "Negotiation Copilot is available for material findings (high or medium attention) only.",
        },
        { status: 422 }
      );
    }

    const draft = await generateNegotiationPlan(input);
    return NextResponse.json({ success: true, draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate negotiation draft.";
    return NextResponse.json(
      { success: false, error: `Negotiation Copilot encountered an issue: ${message.slice(0, 200)}` },
      { status: 500 }
    );
  }
}

// Live AI calls can take several seconds; the default serverless limit is too tight.
export const maxDuration = 60;
