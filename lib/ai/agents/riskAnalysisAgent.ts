import type { Clause, Finding, SeverityLevel } from "@/types";

export interface RiskAnalysisInput {
  documentId: string;
  clauses: Clause[];
  userRole?: string; // e.g., "Employee", "Tenant", "Contractor"
}

export interface RiskAnalysisResult {
  findings: Omit<Finding, "evidence">[];
  criticalAttentionCount: number;
  highAttentionCount: number;
  reviewCount: number;
  contextDependentCount: number;
  informationalCount: number;
}

/**
 * Evaluates extracted clauses and generates initial objective Findings.
 * Adheres strictly to the rule: "Important" does NOT mean "illegal".
 * Findings use calibrated language ("deserves attention", "financial obligation", "potentially broad").
 */
export function identifyImportantClausesAndFindings(
  input: RiskAnalysisInput
): RiskAnalysisResult {
  const findings: Omit<Finding, "evidence">[] = [];

  let criticalCount = 0;
  let highCount = 0;
  let reviewCount = 0;
  let contextCount = 0;
  let infoCount = 0;

  for (let idx = 0; idx < input.clauses.length; idx++) {
    const clause = input.clauses[idx];
    const text = clause.rawText.toLowerCase();

    // Finding 1: Early termination financial obligation / training reimbursement
    if (
      (clause.category === "payment" || clause.category === "termination") &&
      (text.includes("reimburse") ||
        text.includes("liquidated damages") ||
        text.includes("accelerated rent") ||
        text.includes("training fee"))
    ) {
      const severity: SeverityLevel = text.includes("liquidated damages") || text.includes("accelerated")
        ? "critical_attention"
        : "high_attention";

      if (severity === "critical_attention") criticalCount++;
      else highCount++;

      findings.push({
        id: `finding-${input.documentId}-${idx + 1}`,
        title: `${clause.title} creates potential exit financial obligation`,
        category: "Financial & Termination Obligations",
        severity,
        description: `This clause stipulates a financial payment or reimbursement upon early departure prior to the designated commitment window.`,
        whyItMatters: `This creates a direct monetary liability if separation occurs before the agreed period, which could substantially impact departure decisions.`,
        clauseId: clause.id,
        uncertainties: [
          "Actual enforceability depends on whether the amount represents actual costs incurred versus an agreed estimate.",
          "Jurisdictional rules on wage deductions and training expense recoupment vary significantly.",
        ],
      });
      continue;
    }

    // Finding 2: Restrictive covenants (non-compete / non-solicit)
    if (
      clause.category === "restriction" ||
      text.includes("non-compete") ||
      text.includes("non-solicitation")
    ) {
      highCount++;
      findings.push({
        id: `finding-${input.documentId}-${idx + 1}`,
        title: `Post-employment restrictive covenant deserves review`,
        category: "Restrictive Covenants",
        severity: "high_attention",
        description: `The agreement restricts competitive business activities or client solicitation following termination of the relationship.`,
        whyItMatters: `Post-employment restrictions may limit future employment or business opportunities within the specified geographical area and timeframe.`,
        clauseId: clause.id,
        uncertainties: [
          "State and regional enforceability of non-compete covenants is subject to statutory geographic and duration constraints.",
          "Reasonableness of geographic scope and defined competitive industry sectors.",
        ],
      });
      continue;
    }

    // Finding 3: Broad Intellectual Property Assignment
    if (
      clause.category === "intellectual_property" &&
      (text.includes("all inventions") ||
        text.includes("conceived during") ||
        text.includes("sole and exclusive property"))
    ) {
      highCount++;
      findings.push({
        id: `finding-${input.documentId}-${idx + 1}`,
        title: `Broad intellectual property assignment language`,
        category: "Intellectual Property Ownership",
        severity: "high_attention",
        description: `The provision assigns ownership of intellectual creations and inventions developed during the tenure of the agreement.`,
        whyItMatters: `Broad wording may encompass personal projects or off-duty work unless explicit statutory carve-outs (such as inventions developed without company equipment) are designated.`,
        clauseId: clause.id,
        uncertainties: [
          "Whether the scope extends to inventions created outside business hours without proprietary assets.",
          "Applicability of mandatory statutory employee invention exemptions in the governing jurisdiction.",
        ],
      });
      continue;
    }

    // Finding 4: Notice Periods
    if (
      clause.category === "notice" ||
      text.includes("days' notice") ||
      text.includes("days notice")
    ) {
      reviewCount++;
      findings.push({
        id: `finding-${input.documentId}-${idx + 1}`,
        title: `Designated advance notice period for termination`,
        category: "Notice Requirements",
        severity: "review",
        description: `Specifies a required window of advance written notice prior to departure or contract termination.`,
        whyItMatters: `Failing to observe notice terms could constitute a breach or trigger financial forfeiture under related contractual clauses.`,
        clauseId: clause.id,
        uncertainties: [
          "Whether the employer retains discretion to waive the notice period with or without pay.",
        ],
      });
      continue;
    }

    // Finding 5: Mandatory Arbitration & Dispute Forum
    if (
      clause.category === "dispute_resolution" &&
      (text.includes("arbitration") || text.includes("jury waiver"))
    ) {
      reviewCount++;
      findings.push({
        id: `finding-${input.documentId}-${idx + 1}`,
        title: `Mandatory dispute resolution through binding arbitration`,
        category: "Dispute Resolution & Forum",
        severity: "review",
        description: `Disputes must be submitted to binding private arbitration rather than public judicial courts, with waiver of jury trials.`,
        whyItMatters: `Limits access to standard civil trial procedures, discovery mechanisms, and formal appeals. Also determines forum travel requirements.`,
        clauseId: clause.id,
        uncertainties: [
          "Allocation of arbitration administrative fees and arbitrator compensation between the parties.",
        ],
      });
      continue;
    }

    // Finding 6: Unilateral Indemnity or Liability
    if (clause.category === "indemnity" || clause.category === "liability") {
      reviewCount++;
      findings.push({
        id: `finding-${input.documentId}-${idx + 1}`,
        title: `Risk allocation and defense obligations`,
        category: "Indemnification & Liability",
        severity: "review",
        description: `Allocates third-party claims, legal defense costs, and potential liabilities between the executing parties.`,
        whyItMatters: `Unilateral indemnity can impose financial defense burdens even if fault is shared or undetermined.`,
        clauseId: clause.id,
        uncertainties: [
          "Whether contractual liability is covered by commercial insurance policies.",
        ],
      });
      continue;
    }

    // Count other clause severities for the summary
    if (clause.importance === "context_dependent") {
      contextCount++;
    } else {
      infoCount++;
    }
  }

  return {
    findings,
    criticalAttentionCount: criticalCount,
    highAttentionCount: highCount,
    reviewCount,
    contextDependentCount: contextCount,
    informationalCount: infoCount,
  };
}
