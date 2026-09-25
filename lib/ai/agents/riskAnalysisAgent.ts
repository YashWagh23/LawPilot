import type { Clause, DocumentType, Finding, JurisdictionContext, SeverityLevel } from "@/types";
import { classifyDocumentType, documentTypeLabel, isEmploymentType } from "@/lib/documents/documentClassifier";
import { getJurisdictionFamily, type JurisdictionFamily } from "@/lib/jurisdiction/jurisdictionDetector";

export interface RiskAnalysisInput {
  documentId: string;
  clauses: Clause[];
  userRole?: string; // e.g., "Employee", "Tenant", "Contractor"
  /** When omitted, inferred from the clause text. */
  documentType?: DocumentType;
  /** Detected jurisdiction. Jurisdiction-specific commentary is emitted only for a known family. */
  jurisdiction?: JurisdictionContext;
}

export interface RiskAnalysisResult {
  findings: Omit<Finding, "evidence">[];
  criticalAttentionCount: number;
  highAttentionCount: number;
  reviewCount: number;
  contextDependentCount: number;
  informationalCount: number;
}

type FindingDraft = Omit<Finding, "evidence">;

const has = (text: string, re: RegExp): boolean => re.test(text);

/**
 * A sentence about how local law treats this issue. Only ever states law for a jurisdiction the
 * document actually established; otherwise it says that the governing law decides.
 */
function lawNote(
  family: JurisdictionFamily,
  topic: "training" | "restraint" | "ip" | "arbitration" | "generic",
  jurisdiction?: JurisdictionContext
): string {
  if (family === "india") {
    switch (topic) {
      case "training":
        return " Under Indian law (e.g. Section 74 Indian Contract Act), such amounts are enforceable only to the extent of actual, reasonable expenditure incurred.";
      case "restraint":
        return " Under Section 27 of the Indian Contract Act, post-employment non-compete agreements are void as restraints of trade.";
      default:
        return "";
    }
  }
  if (family === "united_states") {
    switch (topic) {
      case "training":
        return " In the U.S., whether training-cost repayment and wage deductions are enforceable depends on state wage-payment and penalty rules and on how the amount relates to actual cost.";
      case "restraint":
        return " Many U.S. states test post-employment restrictions for reasonableness in scope, duration and legitimate business interest, and some restrict them further.";
      default:
        return "";
    }
  }
  const where =
    jurisdiction && jurisdiction.country !== "Unknown" ? `the law of ${jurisdiction.country}` : "the governing law, which this document does not clearly establish,";
  return ` Whether and how this is enforced depends on ${where} and should be confirmed by a qualified lawyer.`;
}

/**
 * Evaluates extracted clauses and generates initial objective Findings.
 * Adheres strictly to the rule: "Important" does NOT mean "illegal".
 * Findings use calibrated language ("deserves attention", "financial obligation", "potentially broad").
 *
 * The rules are topic-based and apply to any agreement type. Wording is chosen from the document
 * type (never assumes an employee/employer relationship) and law commentary is emitted only for a
 * jurisdiction the document actually established.
 */
export function identifyImportantClausesAndFindings(
  input: RiskAnalysisInput
): RiskAnalysisResult {
  const findings: FindingDraft[] = [];

  const documentType =
    input.documentType ?? classifyDocumentType(input.clauses.map((c) => c.rawText).join("\n"));
  const isEmployment = isEmploymentType(documentType);
  const family: JurisdictionFamily = input.jurisdiction ? getJurisdictionFamily(input.jurisdiction) : "unknown";
  const docLabel = documentTypeLabel(documentType);

  let criticalCount = 0;
  let highCount = 0;
  let reviewCount = 0;
  let contextCount = 0;
  let infoCount = 0;

  const bump = (severity: SeverityLevel) => {
    if (severity === "critical_attention") criticalCount++;
    else if (severity === "high_attention") highCount++;
    else if (severity === "review") reviewCount++;
  };

  for (let idx = 0; idx < input.clauses.length; idx++) {
    const clause = input.clauses[idx];
    const text = clause.rawText.toLowerCase();
    const title = clause.title.toLowerCase();
    const id = `finding-${input.documentId}-${idx + 1}`;

    // ── Exit financial obligations: reimbursement / liquidated damages / early-termination charges
    const mentionsTraining = has(title, /\btraining\b/) || (has(text, /\btraining\b/) && has(text, /reimburs|repay|documented cost/));
    const isTrainingReimbursement =
      isEmployment &&
      (clause.category === "payment" || clause.category === "termination") &&
      mentionsTraining;

    const isExitPenaltyOrDamages =
      (clause.category === "payment" || clause.category === "termination" || clause.category === "renewal") &&
      (has(text, /liquidated damages|accelerated rent|early (?:departure|termination) (?:penalty|fee|charge)/) ||
        (has(text, /\bpenalt(?:y|ies)\b/) && has(text, /departure|early termination|premature/)));

    if (isTrainingReimbursement || isExitPenaltyOrDamages) {
      const severity: SeverityLevel = isExitPenaltyOrDamages ? "critical_attention" : "high_attention";
      findings.push({
        id,
        title: isTrainingReimbursement
          ? `Training cost reimbursement obligation upon voluntary resignation`
          : `${clause.title} creates potential exit financial obligation`,
        category: "Financial & Termination Obligations",
        severity,
        description: isTrainingReimbursement
          ? `This clause stipulates a financial reimbursement or cost recovery obligation if the employee resigns within a designated timeframe following sponsored training.`
          : `This clause stipulates a fixed sum, penalty or accelerated payment that becomes payable if the ${docLabel} ends early or is breached.`,
        whyItMatters:
          `This creates an exit financial obligation that could require paying a significant sum on early departure or termination.${lawNote(
            family,
            "training",
            input.jurisdiction
          )}`,
        clauseId: clause.id,
        uncertainties: [
          "Actual enforceability depends on whether the amount represents actual costs incurred versus an agreed estimate.",
          "Jurisdictional rules on penalties, wage deductions and cost recoupment vary significantly.",
        ],
      });
      bump(severity);
      continue;
    }

    // ── Restrictive covenants (non-compete / non-solicit / exclusivity)
    const isNonCompete =
      has(text, /non-?compet/) || (has(text, /\bshall not\b|\bagrees? not to\b/) && has(text, /\bcompet(?:e|ing|itor|ition)\b/));
    const isNonSolicit =
      has(text, /non-?solicit/) || (has(text, /\bshall not\b|\bagrees? not to\b/) && has(text, /\bsolicit|\bdivert\b/));
    const isExclusivity = has(text, /\bexclusiv(?:e|ity)\b/) && has(text, /\bshall not\b|\bnot\b.{0,40}\b(?:other|third)\s+part/);
    const isPostEmploymentRestriction = isEmployment && (clause.category === "restriction" || has(title, /post-employment restriction/));
    if (isNonCompete || isNonSolicit || isExclusivity || isPostEmploymentRestriction) {
      const kind = isNonCompete
        ? "non-compete"
        : isNonSolicit
        ? "non-solicitation"
        : isExclusivity
        ? "exclusivity"
        : "restrictive";
      const heading = isEmployment
        ? kind === "non-compete"
          ? "Post-employment non-compete restriction deserves review"
          : kind === "non-solicitation"
          ? "Non-solicitation of clients and personnel deserves review"
          : "Post-employment restrictive covenant deserves review"
        : kind === "non-compete"
        ? "Non-compete restriction deserves review"
        : kind === "non-solicitation"
        ? "Non-solicitation restriction deserves review"
        : kind === "exclusivity"
        ? "Exclusivity restriction deserves review"
        : "Restrictive covenant deserves review";
      findings.push({
        id,
        title: heading,
        category: "Restrictive Covenants",
        severity: "high_attention",
        description: `The agreement restricts competitive business activities, exclusivity, or solicitation of clients or personnel during and/or after the relationship.`,
        whyItMatters: `Restrictions like this may limit future work or business opportunities within the specified area and timeframe.${lawNote(
          family,
          isEmployment && kind !== "non-solicitation" ? "restraint" : "generic",
          input.jurisdiction
        )}`,
        clauseId: clause.id,
        uncertainties: [
          "Enforceability of restrictive covenants is subject to jurisdiction-specific limits on scope and duration.",
          "Reasonableness of the geographic scope and the defined competitive sectors or persons covered.",
        ],
      });
      highCount++;
      continue;
    }

    // ── Broad intellectual property assignment / ownership
    if (
      clause.category === "intellectual_property" &&
      has(
        text,
        /all inventions|conceived during|sole and exclusive property|assign(?:s|ment)? to cover|course of employment|whether or not during|all (?:right, title|works|deliverables|work product)|hereby assigns?/
      )
    ) {
      findings.push({
        id,
        title: isEmployment ? `Broad intellectual property assignment language` : `Intellectual property ownership allocation`,
        category: "Intellectual Property Ownership",
        severity: "high_attention",
        description: isEmployment
          ? `The provision assigns ownership of intellectual creations and inventions developed during the tenure of the agreement.`
          : `The provision allocates ownership of intellectual property, work product or deliverables between the parties.`,
        whyItMatters: isEmployment
          ? `Broad wording may encompass personal projects or off-duty work unless explicit carve-outs (such as inventions developed without company equipment) are designated.`
          : `Broad assignment wording can transfer rights you may want to retain, such as pre-existing materials, tools and general know-how, unless they are expressly carved out.`,
        clauseId: clause.id,
        uncertainties: [
          isEmployment
            ? "Whether the scope extends to inventions created outside business hours without proprietary assets."
            : "Whether pre-existing or background intellectual property is excluded from the assignment.",
          "Applicability of any mandatory statutory exemptions in the governing jurisdiction.",
        ],
      });
      highCount++;
      continue;
    }

    // ── Notice periods / termination notice
    const durationInNotice =
      has(text, /(?:\b\d+|\(\s*\d+\s*\))\s*(?:calendar\s+|business\s+|working\s+)?(?:days?|weeks?|months?)['’]?\s*(?:prior\s+|advance\s+|written\s+)*notice/) ||
      has(text, /\bnotice\s+(?:period\s+)?(?:of|not less than|at least)\s+(?:[a-z-]+\s+)?(?:\(\s*\d+\s*\)|\d+)\s*(?:calendar\s+|business\s+)?(?:days?|weeks?|months?)/);
    const isRenewalClause = has(text, /automatic(?:ally)? renew|auto-?renew|evergreen|lock-?in period/);
    if ((clause.category === "notice" || durationInNotice) && !isRenewalClause) {
      findings.push({
        id,
        title: isEmployment ? `Designated advance notice period for termination` : `Notice and termination timing terms`,
        category: "Notice Requirements",
        severity: "review",
        description: isEmployment
          ? `Specifies a required window of advance written notice prior to departure or contract termination.`
          : `Specifies a required window of advance written notice before the agreement can be ended or a right exercised.`,
        whyItMatters: `Failing to observe notice terms could constitute a breach or trigger financial consequences under related clauses.`,
        clauseId: clause.id,
        uncertainties: [
          "Whether the counterparty retains discretion to waive or shorten the notice period, with or without payment.",
        ],
      });
      reviewCount++;
      continue;
    }

    // ── Mandatory arbitration / dispute forum
    if (
      clause.category === "dispute_resolution" &&
      has(text, /arbitrat|jury waiver|exclusive jurisdiction|courts? (?:at|in|of)/)
    ) {
      const arbitration = has(text, /arbitrat/);
      findings.push({
        id,
        title: arbitration ? `Mandatory dispute resolution through binding arbitration` : `Exclusive court forum for disputes`,
        category: "Dispute Resolution & Forum",
        severity: "review",
        description: arbitration
          ? `Disputes must be submitted to binding private arbitration rather than public judicial courts${has(text, /jury/) ? ", with waiver of jury trials" : ""}.`
          : `Disputes must be brought in specified courts, which may be distant or inconvenient for one party.`,
        whyItMatters: arbitration
          ? `Limits access to standard civil trial procedures, discovery mechanisms, and formal appeals. Also determines forum travel requirements and who bears the costs.`
          : `Fixes where a dispute must be heard, which affects cost, convenience and applicable procedure.`,
        clauseId: clause.id,
        uncertainties: [
          arbitration
            ? "Allocation of arbitration administrative fees and arbitrator compensation between the parties."
            : "Whether the chosen forum is practical for both parties.",
        ],
      });
      reviewCount++;
      continue;
    }

    // ── Indemnity / liability allocation
    if (clause.category === "indemnity" || clause.category === "liability") {
      findings.push({
        id,
        title: `Risk allocation and defense obligations`,
        category: "Indemnification & Liability",
        severity: "review",
        description: `Allocates third-party claims, legal defense costs, and potential liabilities between the executing parties.`,
        whyItMatters: `Unilateral indemnity or an uncapped liability can impose financial burdens even if fault is shared or undetermined.`,
        clauseId: clause.id,
        uncertainties: [
          "Whether liability is capped, mutual, or covered by insurance.",
        ],
      });
      reviewCount++;
      continue;
    }

    // ── Automatic renewal / lock-in
    if (has(text, /automatic(?:ally)? renew|auto-?renew|evergreen|lock-?in period/)) {
      findings.push({
        id,
        title: has(text, /lock-?in/) ? `Lock-in period and early exit terms` : `Automatic renewal terms`,
        category: "Renewal & Lock-in Terms",
        severity: "review",
        description: `The agreement renews automatically or commits a party for a minimum period, and ending it early may carry a cost.`,
        whyItMatters: `If the non-renewal or exit window is missed, the commitment can continue for another full term, sometimes at a higher price.`,
        clauseId: clause.id,
        uncertainties: [
          "The deadline and method for giving notice of non-renewal or early exit.",
          "Whether early exit triggers a fee or forfeiture.",
        ],
      });
      reviewCount++;
      continue;
    }

    // ── Deposits: forfeiture / deductions
    if (has(text, /\bdeposit\b/) && has(text, /forfeit|non-?refundable|deduct|withh?old/)) {
      findings.push({
        id,
        title: `Security deposit deductions or forfeiture`,
        category: "Deposits & Forfeiture",
        severity: "review",
        description: `The clause allows a deposit or advance to be deducted from, withheld, or forfeited under stated conditions.`,
        whyItMatters: `Broad deduction or forfeiture rights can reduce what is returned at the end even where no real loss occurred.`,
        clauseId: clause.id,
        uncertainties: ["What must be documented (inspection reports, receipts) before deductions are made.", "How quickly any balance must be returned."],
      });
      reviewCount++;
      continue;
    }

    // ── Payment escalation, late fees, interest
    if (clause.category === "payment" && has(text, /late (?:fee|charge|payment)|interest (?:at|of|on)|escalat|increase[sd]? (?:by|annually)|annual (?:increase|escalation)/)) {
      findings.push({
        id,
        title: `Payment escalation, late fees or interest`,
        category: "Payment Terms",
        severity: "review",
        description: `The payment terms include increases over time, late charges, or interest on overdue amounts.`,
        whyItMatters: `These terms change the true cost of the agreement over its life and add exposure if a payment is late.`,
        clauseId: clause.id,
        uncertainties: ["The exact rate, cap and start date for late charges or escalation.", "Whether a grace period applies."],
      });
      reviewCount++;
      continue;
    }

    // ── Unilateral rights (amend / terminate at will / sole discretion)
    if (has(text, /(?:may|can|reserves? the right to)\s+(?:amend|modify|change|vary|revise)\b.{0,60}(?:at any time|from time to time|sole discretion|without (?:prior )?(?:notice|consent))/) ||
        has(text, /sole (?:and absolute )?discretion of the (?:company|employer|landlord|licensor|provider)/)) {
      findings.push({
        id,
        title: `Unilateral change or discretion rights`,
        category: "Unilateral Rights",
        severity: "review",
        description: `One party may change terms or make key decisions in its sole discretion.`,
        whyItMatters: `Terms that one side can change alone reduce certainty about what was originally agreed.`,
        clauseId: clause.id,
        uncertainties: ["Whether advance notice or consent is required before a change takes effect."],
      });
      reviewCount++;
      continue;
    }

    // ── Confidentiality with no end date
    if (clause.category === "confidentiality" && has(text, /surviv\w+ indefinitely|in perpetuity|no expiration|without (?:limit|limitation) (?:in|of) time/)) {
      findings.push({
        id,
        title: `Confidentiality obligations with no end date`,
        category: "Confidentiality",
        severity: "review",
        description: `Confidentiality duties continue indefinitely rather than for a fixed period.`,
        whyItMatters: `Open-ended confidentiality can restrict future use of general knowledge and skills long after the relationship ends.`,
        clauseId: clause.id,
        uncertainties: ["Whether standard exclusions (public information, independently developed) are stated."],
      });
      reviewCount++;
      continue;
    }

    // Count other clause severities for the summary
    if (clause.importance === "context_dependent") {
      contextCount++;
    } else {
      infoCount++;
    }
  }

  // Two findings that would carry the same title (e.g. a non-compete and a second restriction in
  // another section) must remain distinguishable: append the clause section.
  const titleCounts = new Map<string, number>();
  for (const f of findings) titleCounts.set(f.title, (titleCounts.get(f.title) || 0) + 1);
  const clauseById = new Map(input.clauses.map((c) => [c.id, c]));
  for (const f of findings) {
    if ((titleCounts.get(f.title) || 0) > 1) {
      const section = clauseById.get(f.clauseId)?.section;
      if (section) f.title = `${f.title} (${section})`;
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
