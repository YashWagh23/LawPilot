import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";
import type {
  ActionItem,
  AnalysisReport,
  Clause,
  DocumentMetadata,
  EvidenceChain,
  EvidenceLink,
  Finding,
  KeyDate,
  KeyFinancialTerm,
  LawyerBrief,
} from "@/types";

export interface ComposerInput {
  documentId: string;
  metadata: DocumentMetadata;
  clauses: Clause[];
  findings: Finding[];
  evidenceLinks?: EvidenceLink[];
  financialTerms?: KeyFinancialTerm[];
  keyDates?: KeyDate[];
  evidenceChains?: EvidenceChain[];
  actionItems: ActionItem[];
  lawyerBrief: LawyerBrief;
}

/**
 * Response Composer
 * Synthesizes all agent outputs into a unified, high-readability AnalysisReport,
 * permanently appending canonical legal safety notices.
 */
export async function composeFinalReport(
  input: ComposerInput
): Promise<AnalysisReport> {
  const criticalAttentionCount = input.findings.filter(
    (f) => f.severity === "critical_attention"
  ).length;
  const highAttentionCount = input.findings.filter(
    (f) => f.severity === "high_attention"
  ).length;
  const reviewCount = input.findings.filter(
    (f) => f.severity === "review"
  ).length;
  const contextDependentCount = input.findings.filter(
    (f) => f.severity === "context_dependent"
  ).length;
  const informationalCount = input.findings.filter(
    (f) => f.severity === "informational"
  ).length;

  return {
    id: `report-${input.documentId}`,
    documentId: input.documentId,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
    status: "completed",
    summary: {
      overallReadiness:
        criticalAttentionCount > 0 || highAttentionCount > 0
          ? "high_risk_clauses_present"
          : reviewCount > 0
          ? "review_recommended"
          : "standard_terms",
      keyTakeaway:
        criticalAttentionCount > 0
          ? `Identified ${criticalAttentionCount} critical attention clause(s) requiring immediate attention prior to signing.`
          : highAttentionCount > 0
          ? `Identified ${highAttentionCount} clause(s) requiring attention prior to signing.`
          : "Standard agreement provisions identified with customary terms.",
      totalClausesAnalyzed: input.clauses.length,
      criticalAttentionCount,
      highAttentionCount,
      reviewCount,
      contextDependentCount,
      informationalCount,
    },
    clauses: input.clauses,
    findings: input.findings,
    evidenceLinks: input.evidenceLinks || input.findings.map((f) => f.evidence).filter(Boolean),
    financialTerms: input.financialTerms || [],
    keyDates: input.keyDates || [],
    evidenceChains: input.evidenceChains || [],
    actionItems: input.actionItems,
    lawyerBrief: input.lawyerBrief,
    safetyDisclaimer: GLOBAL_LEGAL_DISCLAIMER,
  };
}
