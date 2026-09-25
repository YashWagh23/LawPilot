import type { AnalysisReport } from "@/types";

export interface RiskCounts {
  criticalAttentionCount: number;
  highAttentionCount: number;
  reviewCount: number;
}

/**
 * Prefix carried by every finding produced while AI analysis was unavailable. Kept free of ". " so that
 * "first sentence" summaries in the UI still show the whole first sentence with the label attached.
 */
export const HEURISTIC_FINDING_LABEL = "Rule-based flag (AI analysis unavailable)";

/** Note added to each heuristic finding's "what to verify" list. */
export const HEURISTIC_FINDING_UNCERTAINTY =
  "This was flagged by an automated keyword and pattern scan because AI analysis was unavailable; it has not been checked against the clause's full context.";

/** True when a finished report's findings came from the heuristic fallback (AI extraction did not succeed). */
export function isHeuristicReport(report: Pick<AnalysisReport, "aiStatus">): boolean {
  return Boolean(report.aiStatus) && !report.aiStatus!.succeededSteps.includes("extraction");
}

/**
 * Overall readiness. The deterministic (heuristic) scan can spot risky patterns but cannot vouch for
 * the rest, so it never reports "standard_terms".
 */
export function deriveOverallReadiness(counts: RiskCounts, heuristic: boolean): AnalysisReport["summary"]["overallReadiness"] {
  if (counts.criticalAttentionCount > 0 || counts.highAttentionCount > 0) return "high_risk_clauses_present";
  if (counts.reviewCount > 0 || heuristic) return "review_recommended";
  return "standard_terms";
}

/**
 * One-paragraph takeaway. States plainly when it comes from the heuristic fallback, and never claims that
 * unflagged terms are "standard" or "customary": a pattern scan finding nothing is not evidence of that.
 */
export function buildKeyTakeaway(counts: RiskCounts, heuristic: boolean): string {
  const { criticalAttentionCount: critical, highAttentionCount: high, reviewCount: review } = counts;
  const lead = heuristic ? "Heuristic scan (AI analysis unavailable): " : "";

  if (critical > 0) {
    return heuristic
      ? `${lead}${critical} clause(s) matched critical-attention patterns and ${high} more matched high-attention patterns. These are keyword and pattern matches to check against the full clause text, not conclusions.`
      : `Identified ${critical} critical attention clause(s) and ${high} item(s) deserving review prior to execution.`;
  }
  if (high > 0) {
    return heuristic
      ? `${lead}${high} clause(s) matched high-attention patterns. These are keyword and pattern matches to check against the full clause text, not conclusions.`
      : `Identified ${high} clause(s) that deserve close attention prior to execution.`;
  }
  if (review > 0) {
    return heuristic
      ? `${lead}${review} clause(s) matched review patterns. This is a keyword and pattern scan of the text, so terms it did not flag have not been assessed.`
      : `Flagged ${review} clause(s) for review before you rely on this document.`;
  }
  return heuristic
    ? `${lead}no clause matched the scan's risk patterns. That does not mean the terms are standard or low-risk: read the full document and consider legal review.`
    : "No clause matched LawPilot's attention criteria. This is not a finding that the terms are standard or safe: read the full document before relying on it.";
}
