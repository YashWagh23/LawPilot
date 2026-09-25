import type { AnalysisReport, EvidenceChain, VerificationStatus, VerificationStatusLevel } from "@/types";

export type VerificationTone = "verified" | "partial" | "unverified";

export interface VerificationBadge {
  tone: VerificationTone;
  /** Short badge text. "Verified" is only ever returned when real verified sources back it. */
  label: string;
  /** One sentence explaining the state, suitable for a tooltip or caption. */
  detail: string;
}

export interface ReportVerificationState extends VerificationBadge {
  /** Distinct legal sources that backed a chain the verification gate marked verified. */
  verifiedSourceCount: number;
  verifiedChainCount: number;
  totalChainCount: number;
}

type AnyStatus = VerificationStatusLevel | VerificationStatus | string | undefined;

const NO_VERIFIED_SOURCES_DETAIL =
  "No legal source could be verified for this document, so the findings rest on the document text alone.";

/**
 * A chain counts as verified only when the gate said so AND at least one legal source survived it.
 * A "verified" status with no source behind it is never shown as verified.
 */
function hasVerifiedBacking(chain: EvidenceChain): boolean {
  return chain.verification?.status === "verified" && (chain.legalSources?.length ?? 0) > 0;
}

function hasPartialBacking(chain: EvidenceChain): boolean {
  return chain.verification?.status === "partially_verified" && (chain.legalSources?.length ?? 0) > 0;
}

/** The badge for a single evidence chain (or compare change). */
export function getChainVerificationBadge(chain: Pick<EvidenceChain, "verification" | "legalSources">): VerificationBadge {
  const status: AnyStatus = chain.verification?.status;
  const hasSources = (chain.legalSources?.length ?? 0) > 0;

  if (status === "verified" && hasSources) {
    return { tone: "verified", label: "Verified", detail: "Backed by a verified legal source in the document's jurisdiction." };
  }
  if (status === "partially_verified" && hasSources) {
    return {
      tone: "partial",
      label: "Partially verified",
      detail: "A legal source supports part of this issue, with limits on jurisdiction or scope.",
    };
  }
  if (status === "conflicting") {
    return { tone: "partial", label: "Conflicting sources", detail: "The legal sources found do not agree on this issue." };
  }
  return { tone: "unverified", label: "Not verified", detail: NO_VERIFIED_SOURCES_DETAIL };
}

/**
 * Report-level verification state for the header badge. "Verified" requires every evidence chain to be
 * backed by a verified source; zero verified sources always reads "Not verified".
 */
export function getReportVerificationState(
  report: Pick<AnalysisReport, "evidenceChains">
): ReportVerificationState {
  const chains = report.evidenceChains ?? [];
  const verifiedChains = chains.filter(hasVerifiedBacking);
  const partialChains = chains.filter(hasPartialBacking);

  const verifiedSourceIds = new Set<string>();
  for (const chain of verifiedChains) {
    for (const source of chain.legalSources) {
      verifiedSourceIds.add(`${source.citation}|${source.jurisdiction}`);
    }
  }

  const base = {
    verifiedSourceCount: verifiedSourceIds.size,
    verifiedChainCount: verifiedChains.length,
    totalChainCount: chains.length,
  };

  if (verifiedChains.length === 0 && partialChains.length === 0) {
    return { ...base, tone: "unverified", label: "Not verified", detail: NO_VERIFIED_SOURCES_DETAIL };
  }
  if (verifiedChains.length === chains.length) {
    return {
      ...base,
      tone: "verified",
      label: "Verified",
      detail: `${verifiedSourceIds.size} verified legal ${verifiedSourceIds.size === 1 ? "source supports" : "sources support"} these findings.`,
    };
  }
  return {
    ...base,
    tone: "partial",
    label: "Partially verified",
    detail: `${verifiedChains.length + partialChains.length} of ${chains.length} findings have a legal source behind them; the rest rely on the document text alone.`,
  };
}

/** Text and pill classes per tone, shared so every badge colours the same state the same way. */
export const VERIFICATION_TONE_CLASSES: Record<VerificationTone, { text: string; pill: string }> = {
  verified: {
    text: "text-emerald-700 dark:text-emerald-400",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  partial: {
    text: "text-amber-700 dark:text-amber-400",
    pill: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  unverified: {
    text: "text-slate-600 dark:text-slate-400",
    pill: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};
