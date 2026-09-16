import type {
  ActionPlanItem,
  ChangeSignificance,
  ChangeType,
  Clause,
  ClauseCategory,
  ClauseComparisonItem,
  ImpactCategory,
  SemanticDiffDetail,
} from "@/types";
import type { MatchedClausePair } from "./clauseMatcher";

/**
 * Normalizes text for strict identical comparison (strips excessive whitespace)
 */
function normalizeTextForComparison(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips punctuation to check for wording-only or punctuation-only differences
 */
function stripPunctuation(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Extracts notice period day count from text
 */
function extractNoticeDays(text: string): number | null {
  const match = text.match(/([0-9]{1,3})\s*(?:calendar\s+)?days?(?:['’]?\s*(?:written\s+)?notice)?/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val <= 365) return val;
  }
  // Also check spelled-out words: "sixty (60)", "ninety (90)", "thirty (30)"
  const parenthesized = text.match(/\(([0-9]{2,3})\)/);
  if (parenthesized) {
    const val = parseInt(parenthesized[1], 10);
    if (!isNaN(val) && val > 0 && val <= 365) return val;
  }
  return null;
}

/**
 * Extracts Indian currency amounts (₹ or INR or Lakhs) or numeric figures
 */
function extractIndianRupeeAmount(text: string): { amount: number; formatted: string } | null {
  // Check ₹4,50,000 or INR 4,50,000 or INR 450000
  const inrMatch = text.match(/(?:INR|₹|Rs\.?)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (inrMatch) {
    const cleanNum = inrMatch[1].replace(/,/g, "");
    const amount = parseFloat(cleanNum);
    if (!isNaN(amount) && amount > 0) {
      return {
        amount,
        formatted: `₹${inrMatch[1]}`,
      };
    }
  }

  // Check spelled out "INR 4,50,000 (Rupees Four Lakh...)"
  const lakhMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*lakh/i);
  if (lakhMatch) {
    const amount = parseFloat(lakhMatch[1]) * 100000;
    return {
      amount,
      formatted: `₹${amount.toLocaleString("en-IN")}`,
    };
  }

  return null;
}

/**
 * Extracts duration in months
 */
function extractDurationMonths(text: string): number | null {
  const match = text.match(/([0-9]{1,2})\s*(?:\([0-9]{1,2}\)\s*)?months?/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val)) return val;
  }
  return null;
}

/**
 * Formats Indian Rupee currency standard
 */
function formatCurrency(num: number): string {
  return `₹${num.toLocaleString("en-IN")}`;
}

/**
 * Detects specialized semantic differences between two clauses
 */
function extractSemanticParameters(
  prevClause: Clause,
  currClause: Clause
): {
  semanticDetails: SemanticDiffDetail[];
  impacts: { category: ImpactCategory; label: string; description: string }[];
  highlightNotes: string[];
} {
  const details: SemanticDiffDetail[] = [];
  const impacts: { category: ImpactCategory; label: string; description: string }[] = [];
  const highlightNotes: string[] = [];

  const prevText = prevClause.rawText;
  const currText = currClause.rawText;

  // 1. Notice Period Analysis
  const prevNotice = extractNoticeDays(prevText);
  const currNotice = extractNoticeDays(currText);
  if (prevNotice !== null && currNotice !== null && prevNotice !== currNotice) {
    const delta = currNotice - prevNotice;
    const sign = delta > 0 ? `+${delta} days` : `${delta} days`;
    details.push({
      parameter: "Notice Period",
      previousValue: `${prevNotice} days`,
      currentValue: `${currNotice} days`,
      changeSummary: `${sign} (${prevNotice} → ${currNotice} days)`,
      impactCategory: "timing",
    });
    impacts.push({
      category: "timing",
      label: "Notice Window",
      description: `Advance resignation notice obligation changed from ${prevNotice} days to ${currNotice} days (${sign}).`,
    });
    highlightNotes.push(`Notice period adjusted from ${prevNotice} to ${currNotice} calendar days.`);
  }

  // 2. Financial Amount & Reimbursement Analysis
  const prevAmount = extractIndianRupeeAmount(prevText);
  const currAmount = extractIndianRupeeAmount(currText);
  if (prevAmount && currAmount && prevAmount.amount !== currAmount.amount) {
    const diff = currAmount.amount - prevAmount.amount;
    const percent = Math.round((diff / prevAmount.amount) * 100);
    const sign = diff > 0 ? `+${formatCurrency(diff)} (+${percent}%)` : `${formatCurrency(diff)} (${percent}%)`;
    details.push({
      parameter: "Financial Obligation / Reimbursement",
      previousValue: prevAmount.formatted,
      currentValue: currAmount.formatted,
      changeSummary: `${sign} (${prevAmount.formatted} → ${currAmount.formatted})`,
      impactCategory: "financial",
    });
    impacts.push({
      category: "financial",
      label: "Financial Obligation",
      description: `Stipulated reimbursement increased from ${prevAmount.formatted} to ${currAmount.formatted} (${sign}).`,
    });
    highlightNotes.push(`Reimbursement increased by ${formatCurrency(diff)}.`);
  }

  // Check commitment / tenure duration (e.g. 12 months vs 18 months)
  const prevMonths = extractDurationMonths(prevText);
  const currMonths = extractDurationMonths(currText);
  if (prevMonths !== null && currMonths !== null && prevMonths !== currMonths) {
    const delta = currMonths - prevMonths;
    const sign = delta > 0 ? `+${delta} months` : `${delta} months`;
    details.push({
      parameter: "Commitment / Tenure Threshold",
      previousValue: `${prevMonths} months`,
      currentValue: `${currMonths} months`,
      changeSummary: `${sign} (${prevMonths} → ${currMonths} months)`,
      impactCategory: "timing",
    });
    impacts.push({
      category: "timing",
      label: "Tenure Horizon",
      description: `Commitment window extended from ${prevMonths} to ${currMonths} months before obligation lapses.`,
    });
  }

  // 3. Non-Compete Geographic & Temporal Scope Analysis
  const isRestrictive = prevClause.category === "restriction" || currClause.category === "restriction" ||
    currText.toLowerCase().includes("non-compete") || currText.toLowerCase().includes("competing");
  if (isRestrictive) {
    const prevIndia = prevText.toLowerCase().includes("republic of india") || prevText.toLowerCase().includes("india");
    const prevMaha = prevText.toLowerCase().includes("maharashtra") || prevText.toLowerCase().includes("pune") || prevText.toLowerCase().includes("mumbai");
    const currIndia = currText.toLowerCase().includes("republic of india") || currText.toLowerCase().includes("territory of india") || currText.toLowerCase().includes("india");

    if (prevMaha && !prevIndia && currIndia) {
      details.push({
        parameter: "Geographic Scope",
        previousValue: "State of Maharashtra",
        currentValue: "Territory of India (Nationwide)",
        changeSummary: "Expanded from regional (Maharashtra) to all-India nationwide restriction",
        impactCategory: "scope",
      });
      impacts.push({
        category: "scope",
        label: "Geographic Scope",
        description: "Post-employment restriction expanded from State of Maharashtra to all of India.",
      });
    }

    if (prevMonths && currMonths && prevMonths !== currMonths) {
      impacts.push({
        category: "legal",
        label: "Restrictive Covenant",
        description: `Post-employment non-compete duration expanded to ${currMonths} months.`,
      });
    }
  }

  // 4. Intellectual Property Scope Analysis
  const isIP = prevClause.category === "intellectual_property" || currClause.category === "intellectual_property" ||
    currText.toLowerCase().includes("inventions") || currText.toLowerCase().includes("patent");
  if (isIP) {
    const prevHoursOnly = prevText.toLowerCase().includes("working hours") && !prevText.toLowerCase().includes("whether or not during regular working hours");
    const currAllHours = currText.toLowerCase().includes("whether or not during regular working hours") ||
      currText.toLowerCase().includes("whether or not utilizing company hardware");

    if (prevHoursOnly || currAllHours) {
      details.push({
        parameter: "IP Assignment Scope",
        previousValue: "Work hours & company facilities",
        currentValue: "24/7 all times, including personal hardware outside work hours",
        changeSummary: "Scope broadened to capture software and inventions created on personal time and devices",
        impactCategory: "scope",
      });
      impacts.push({
        category: "scope",
        label: "Ownership Reach",
        description: "Expanded assignment to include work conceived outside regular hours and on personal equipment.",
      });
      impacts.push({
        category: "legal",
        label: "Statutory Boundary",
        description: "May exceed customary 'course of employment' inventions copyright protection under Indian law.",
      });
    }
  }

  // 5. Dispute Resolution / Arbitration Appointment Analysis
  const isArbitration = prevClause.category === "dispute_resolution" || currClause.category === "dispute_resolution" ||
    currText.toLowerCase().includes("arbitrat");
  if (isArbitration) {
    const prevMutual = prevText.toLowerCase().includes("mutual") || prevText.toLowerCase().includes("agreed by both");
    const currUnilateral = currText.toLowerCase().includes("appointed exclusively by") ||
      currText.toLowerCase().includes("managing director") || currText.toLowerCase().includes("sole discretion of the company");

    if (currUnilateral) {
      details.push({
        parameter: "Arbitrator Appointment Mechanism",
        previousValue: prevMutual ? "Mutually agreed by both parties" : "Standard appointment",
        currentValue: "Unilateral appointment by Company Managing Director",
        changeSummary: "Shifted from bilateral agreement to unilateral employer appointment of sole arbitrator",
        impactCategory: "legal",
      });
      impacts.push({
        category: "legal",
        label: "Dispute Resolution Neutrality",
        description: "Sole arbitrator appointment transferred to unilateral control of company leadership.",
      });
    }
  }

  // 6. Termination Rights / Pay Deduction Discretion
  const isTermination = prevClause.category === "termination" || prevClause.category === "notice" ||
    currClause.category === "termination" || currClause.category === "notice";
  if (isTermination) {
    const currDeduction = currText.toLowerCase().includes("deduct") || currText.toLowerCase().includes("full and final settlement");
    const prevDeduction = prevText.toLowerCase().includes("deduct");
    if (currDeduction && !prevDeduction) {
      details.push({
        parameter: "Settlement Deduction Remedy",
        previousValue: "Standard departure terms",
        currentValue: "Right to deduct notice pay from full & final settlement",
        changeSummary: "Company reserved right to deduct unserved notice pay directly from terminal settlement dues",
        impactCategory: "operational",
      });
      impacts.push({
        category: "operational",
        label: "Payroll Settlement",
        description: "Direct contractual authorization to withhold unserved notice amounts from final exit pay.",
      });
    }
  }

  return { semanticDetails: details, impacts, highlightNotes };
}

/**
 * Determines change significance and structured explanations
 */
function assessChangeSignificance(
  changeType: ChangeType,
  category: ClauseCategory,
  details: SemanticDiffDetail[],
  prevText: string,
  currText: string,
  isSectionMoved: boolean
): {
  significance: ChangeSignificance;
  explanation: string;
} {
  if (changeType === "UNCHANGED") {
    return {
      significance: "INFORMATIONAL",
      explanation: isSectionMoved
        ? "Clause text is identical; only the section numbering was adjusted."
        : "Clause text is identical between both drafts.",
    };
  }

  if (changeType === "MOVED") {
    return {
      significance: "INFORMATIONAL",
      explanation: "Clause was renumbered to a different section without substantive wording changes.",
    };
  }

  // Check for informational-only differences (punctuation / formatting)
  if (changeType === "MODIFIED") {
    const normA = stripPunctuation(prevText);
    const normB = stripPunctuation(currText);
    if (normA === normB) {
      return {
        significance: "INFORMATIONAL",
        explanation: "Formatting, punctuation, or capitalization adjustments with no material legal impact.",
      };
    }
  }

  // High significance parameters
  const hasHighParameter = details.some(
    (d) =>
      d.parameter.includes("Financial") ||
      d.parameter.includes("Notice Period") ||
      d.parameter.includes("Non-Compete") ||
      d.parameter.includes("Arbitrator") ||
      d.parameter.includes("IP Assignment")
  );

  if (hasHighParameter) {
    return {
      significance: "HIGH",
      explanation: "Materially alters substantive rights, financial liabilities, exit timelines, or dispute resolution mechanisms.",
    };
  }

  if (
    category === "payment" ||
    category === "restriction" ||
    category === "liability" ||
    category === "indemnity" ||
    category === "dispute_resolution"
  ) {
    return {
      significance: "HIGH",
      explanation: "Substantive changes affecting commercial exposure, operational restrictions, or dispute terms.",
    };
  }

  if (category === "termination" || category === "notice" || category === "intellectual_property") {
    return {
      significance: "MEDIUM",
      explanation: "Adjusts operational timelines, termination conditions, or proprietary rights allocation.",
    };
  }

  if (category === "confidentiality" || category === "jurisdiction" || category === "employment") {
    return {
      significance: "LOW",
      explanation: "Minor substantive revisions to administrative terms or customary representations.",
    };
  }

  return {
    significance: "LOW",
    explanation: "Substantive adjustment with limited legal exposure or operational impact.",
  };
}

/**
 * Builds calibrated "Why This Matters", "What to Verify", and "What to Ask"
 *
 * `isIndianJurisdiction` gates the India-specific statutory narrative (Indian Contract Act,
 * Copyright Act, Arbitration and Conciliation Act) in the training/notice/non-compete/IP/
 * arbitration branches below. Those statutory claims are only accurate for an Indian-governed
 * agreement; asserting them for a document governed by a different jurisdiction would be
 * misleading. When the jurisdiction is not confirmed Indian, a jurisdiction-neutral explanation is
 * used instead — still substantive, but without inventing an inapplicable legal conclusion.
 */
function buildWhyThisMatters(
  title: string,
  category: ClauseCategory,
  details: SemanticDiffDetail[],
  changeType: ChangeType,
  _significance: ChangeSignificance,
  _prevClause: Clause | null,
  _currClause: Clause | null,
  isIndianJurisdiction: boolean = true
): {
  whyItMatters: string;
  whatToVerify: string[];
  whatToAsk: string;
  suggestedActionTitle: string;
  suggestedActionExplanation: string;
  suggestedAskQuestion: string;
} {
  const normTitle = title.toLowerCase();

  // 1. Training Bond / Liquidated Damages
  if (normTitle.includes("training") || normTitle.includes("bond") || category === "payment") {
    const amountDiff = details.find((d) => d.parameter.includes("Financial"));
    const amountStr = amountDiff ? amountDiff.changeSummary : "increased amount";
    return {
      whyItMatters: isIndianJurisdiction
        ? `The employee's potential contractual financial exposure is substantially higher (${amountStr}). In Indian employment contracts, liquidated damages clauses are enforceable only to the extent of actual expenses incurred by the employer, not as arbitrary penalties.`
        : `The employee's potential contractual financial exposure is substantially higher (${amountStr}). Whether a fixed reimbursement or liquidated-damages figure like this is enforceable, and whether it must be tied to actual costs incurred, depends on the law that governs this agreement.`,
      whatToVerify: [
        "Itemized actual costs incurred by the employer for external training programs",
        "Clear pro-rata amortization schedule reducing the liability monthly over the tenure",
        "Whether departure for medical reasons or involuntary termination triggers repayment",
        "Contractual authorization enabling direct deduction from accrued terminal salary dues",
      ],
      whatToAsk:
        "Can you provide the itemized documentation of actual training expenses incurred and confirm if an amortization schedule applies?",
      suggestedActionTitle: "Clarify revised training reimbursement amount and request amortization schedule",
      suggestedActionExplanation:
        "Request written confirmation of itemized training costs and ask whether the bond amortizes proportionally over time rather than as a lump sum cliff.",
      suggestedAskQuestion: isIndianJurisdiction
        ? "What changed in the training reimbursement clause, and what should I verify regarding actual expenses under Indian law?"
        : "What changed in the training reimbursement clause, and what should I verify regarding actual expenses under the governing law of this agreement?",
    };
  }

  // 2. Notice Period
  if (normTitle.includes("notice") || category === "notice") {
    const noticeDiff = details.find((d) => d.parameter.includes("Notice Period"));
    const noticeStr = noticeDiff ? noticeDiff.changeSummary : "adjusted notice window";
    return {
      whyItMatters:
        `A longer exit obligation (${noticeStr}) limits future career mobility and increases the financial deduction risk if an incoming employer requires a faster joining date.`,
      whatToVerify: [
        "Whether notice buy-out is mutually available if a replacement is secured early",
        "Whether the company or employee can pay salary in lieu of notice",
        "How unserved notice periods interact with earned leave encashment",
        "Whether garden leave provisions or immediate relief are permitted at employer discretion",
      ],
      whatToAsk:
        "Can we confirm whether notice buyout or early waiver is permitted if project handovers are completed satisfactorily?",
      suggestedActionTitle: "Verify notice period buy-out and early relief terms with HR",
      suggestedActionExplanation:
        "Confirm whether the extended notice period can be shortened via mutual agreement or notice buy-out if handover is completed.",
      suggestedAskQuestion:
        `What are the practical and legal implications of the notice period change (${noticeStr})?`,
    };
  }

  // 3. Non-Compete / Restrictive Covenant
  if (normTitle.includes("non-compete") || category === "restriction") {
    return {
      whyItMatters: isIndianJurisdiction
        ? "The post-employment restriction has been broadened in geographic reach and duration. Under Section 27 of the Indian Contract Act, 1872, post-employment non-compete covenants are generally void as restraints of trade, regardless of reasonableness."
        : "The post-employment restriction has been broadened in geographic reach and/or duration. Whether a restraint like this is enforceable — and to what geographic scope and duration — depends heavily on the law governing this agreement; some jurisdictions void post-employment non-competes outright, while others test them for reasonableness.",
      whatToVerify: [
        "Scope of restricted technological domains and named competing enterprises",
        "Whether non-solicitation of clients is distinguished from general industry employment",
        "Whether post-employment non-compete restraints are enforceable at all under the agreement's governing law, and if so, under what reasonableness standard",
        "Absence of garden leave compensation during the restricted period",
      ],
      whatToAsk: isIndianJurisdiction
        ? "Could we clarify the specific list of direct competitors and align the clause with standard Indian statutory non-solicitation guidelines?"
        : "Could we clarify the specific list of direct competitors and narrow the restriction's geographic and time scope?",
      suggestedActionTitle: "Seek clarification on non-compete scope and define specific competitor list",
      suggestedActionExplanation:
        "Request that the broadened non-compete be narrowed to a specific direct competitor list or focused on non-solicitation of active clients.",
      suggestedAskQuestion: isIndianJurisdiction
        ? "Is the revised post-employment non-compete enforceable under Section 27 of the Indian Contract Act?"
        : "Is the revised post-employment non-compete enforceable under the law governing this agreement?",
    };
  }

  // 4. Intellectual Property Assignment
  if (normTitle.includes("intellectual") || normTitle.includes("inventions") || category === "intellectual_property") {
    return {
      whyItMatters: isIndianJurisdiction
        ? "The assignment reach has been expanded to encompass software created outside business hours and on personal hardware. Under Section 17(c) of the Copyright Act, 1957, employer ownership ordinarily attaches to works authored in the course of employment."
        : "The assignment reach has been expanded to encompass software or inventions created outside business hours and on personal hardware. Whether employer ownership extends that far — versus being limited to work authored in the course of employment — depends on the law and any specific carve-outs governing this agreement.",
      whatToVerify: [
        "Carve-outs for pre-existing open-source contributions and personal side projects",
        "Requirement to disclose personal intellectual property developed on personal time",
        "Whether moral rights waivers are drafted reasonably under applicable statutory law",
        "Clear demarcation between company intellectual assets and independent hobbies",
      ],
      whatToAsk:
        "Can we attach an Exhibit listing pre-existing personal inventions and clarify that personal open-source work unrelated to company business is excluded?",
      suggestedActionTitle: "Document and carve out pre-existing personal projects from IP assignment",
      suggestedActionExplanation:
        "Prepare an exhibit of prior inventions and open-source repositories to explicitly exclude from company assignment.",
      suggestedAskQuestion:
        "Does the revised IP assignment clause overreach regarding software or inventions developed outside work hours?",
    };
  }

  // 5. Arbitration & Dispute Resolution
  if (normTitle.includes("arbitrat") || normTitle.includes("dispute") || category === "dispute_resolution") {
    return {
      whyItMatters: isIndianJurisdiction
        ? "The dispute resolution mechanism has shifted from mutual agreement to unilateral appointment by the company Managing Director. Indian Supreme Court precedent (e.g. Perkins Eastman) has established that an interested party cannot unilaterally appoint a sole arbitrator."
        : "The dispute resolution mechanism has shifted from mutual agreement to unilateral appointment by company leadership. Whether an interested party may unilaterally appoint a sole arbitrator depends on the arbitration law and rules governing this agreement.",
      whatToVerify: [
        "Whether arbitrator appointment requires mutual consensus between both parties",
        "Whether an interested party (e.g. a company officer) may unilaterally appoint the arbitrator under the agreement's governing arbitration law",
        "Arbitration seat and administrative venue designations",
        "Cost-sharing provisions for arbitrator fees and administrative institutional charges",
      ],
      whatToAsk:
        "Could we update this clause to provide for arbitrator appointment by mutual consent or through a recognized arbitral institution?",
      suggestedActionTitle: "Request mutual appointment mechanism for sole arbitrator in dispute clause",
      suggestedActionExplanation:
        "Propose standard bilateral appointment language or institutional arbitration in place of unilateral appointment by company leadership.",
      suggestedAskQuestion: isIndianJurisdiction
        ? "Is unilateral appointment of a sole arbitrator by the company leadership permissible under Indian arbitration law?"
        : "Is unilateral appointment of a sole arbitrator by the company leadership permissible under the arbitration law governing this agreement?",
    };
  }

  // 6. Added Clauses (e.g., Remote Work / Security)
  if (changeType === "ADDED") {
    return {
      whyItMatters:
        "A new clause has been introduced that did not exist in the previous baseline. It imposes additional operational compliance obligations and monitoring guidelines.",
      whatToVerify: [
        "Equipment and home network security requirements",
        "Device monitoring and inspection permissions granted to the employer",
        "Reimbursement provisions for remote office equipment or internet connectivity",
        "Consequences or disciplinary remedies for inadvertent data handling breaches",
      ],
      whatToAsk:
        "Could HR provide the accompanying remote work information security handbook referenced in this new provision?",
      suggestedActionTitle: `Review operational compliance requirements for new ${title} clause`,
      suggestedActionExplanation:
        "Review the operational conditions and verify whether any supplemental policies must be provided before agreement execution.",
      suggestedAskQuestion:
        `What obligations does the newly added ${title} clause introduce for the employee?`,
    };
  }

  // 7. Removed Clauses
  if (changeType === "REMOVED") {
    return {
      whyItMatters:
        "This protection or term was present in the previous draft but has been deleted in the revised version. Deletions can subtly eliminate employee safeguards or procedural guardrails.",
      whatToVerify: [
        "Whether the omission was intentional or an accidental drafting omission",
        "Whether the deleted protection is covered elsewhere in company handbooks or statutory law",
        "What recourse remains if the situation contemplated by this clause arises",
      ],
      whatToAsk:
        `Was the removal of ${title} intentional, and is this subject matter addressed elsewhere in company policies?`,
      suggestedActionTitle: `Clarify reasons for omission of ${title} clause`,
      suggestedActionExplanation:
        "Ask HR to confirm whether the deletion of this clause was intentional and what operational standard governs this topic.",
      suggestedAskQuestion:
        `Why was ${title} removed from the revised draft, and what does this mean for employee protections?`,
    };
  }

  // Default fallback
  return {
    whyItMatters:
      "This revision introduces contractual wording modifications that warrant review to ensure alignment with original expectations and statutory protections.",
    whatToVerify: [
      "Exact operative terms and definitions in the revised clause",
      "Interplay with other sections of the agreement",
      "Whether the change creates asymmetric discretion or operational burdens",
    ],
    whatToAsk:
      `Could you clarify the background and intent behind the updated phrasing in ${title}?`,
    suggestedActionTitle: `Review revised terms in ${title}`,
    suggestedActionExplanation:
      "Review the updated text and ask for written clarification if any terms are ambiguous.",
    suggestedAskQuestion:
      `What changed in ${title}, and what should I verify?`,
  };
}

/**
 * Analyzes differences for a matched pair and generates a complete ClauseComparisonItem
 */
export function analyzeClauseDifference(
  pair: MatchedClausePair,
  index: number,
  isIndianJurisdiction: boolean = true
): ClauseComparisonItem {
  const { previousClause, currentClause, previousSection, currentSection, isSectionMoved } = pair;

  let changeType: ChangeType = "MODIFIED";
  let clauseTitle = "Contract Clause";
  let category: ClauseCategory = "general";

  let originalText = "";
  let revisedText = "";

  if (previousClause && !currentClause) {
    changeType = "REMOVED";
    clauseTitle = previousClause.title;
    category = previousClause.category;
    originalText = previousClause.rawText;
    revisedText = "[Clause removed in current version]";
  } else if (!previousClause && currentClause) {
    changeType = "ADDED";
    clauseTitle = currentClause.title;
    category = currentClause.category;
    originalText = "[Clause not present in previous version]";
    revisedText = currentClause.rawText;
  } else if (previousClause && currentClause) {
    clauseTitle = currentClause.title || previousClause.title;
    category = currentClause.category || previousClause.category;
    originalText = previousClause.rawText;
    revisedText = currentClause.rawText;

    const normA = normalizeTextForComparison(originalText);
    const normB = normalizeTextForComparison(revisedText);

    if (normA === normB) {
      changeType = isSectionMoved ? "MOVED" : "UNCHANGED";
    } else {
      changeType = "MODIFIED";
    }
  }

  // Extract semantic parameters
  const { semanticDetails, impacts, highlightNotes: _highlightNotes } =
    previousClause && currentClause
      ? extractSemanticParameters(previousClause, currentClause)
      : { semanticDetails: [], impacts: [], highlightNotes: [] };

  // Determine significance
  const { significance, explanation: significanceExplanation } = assessChangeSignificance(
    changeType,
    category,
    semanticDetails,
    originalText,
    revisedText,
    isSectionMoved
  );

  // Generate Why This Matters & Action & Ask questions
  const {
    whyItMatters,
    whatToVerify,
    whatToAsk,
    suggestedActionTitle,
    suggestedActionExplanation,
    suggestedAskQuestion,
  } = buildWhyThisMatters(
    clauseTitle,
    category,
    semanticDetails,
    changeType,
    significance,
    previousClause,
    currentClause,
    isIndianJurisdiction
  );

  // Construct brief summary
  let summary = "";
  if (changeType === "ADDED") {
    summary = `New clause added to the contract (${currentSection || "New Section"}).`;
  } else if (changeType === "REMOVED") {
    summary = `Clause removed from the contract (${previousSection || "Previous Section"}).`;
  } else if (changeType === "UNCHANGED") {
    summary = isSectionMoved
      ? `Renumbered from ${previousSection} to ${currentSection}; content unchanged.`
      : `Terms identical to previous version.`;
  } else if (changeType === "MOVED") {
    summary = `Renumbered from ${previousSection} to ${currentSection} without text changes.`;
  } else {
    // MODIFIED
    if (semanticDetails.length > 0) {
      summary = semanticDetails.map((d: SemanticDiffDetail) => d.changeSummary).join("; ");
      if (isSectionMoved) {
        summary = `Renumbered (${previousSection} → ${currentSection}) and modified: ${summary}`;
      }
    } else {
      summary = isSectionMoved
        ? `Renumbered from ${previousSection} to ${currentSection} with wording adjustments.`
        : `Updated contractual wording and obligations.`;
    }
  }

  const changeSlug = (clauseTitle || "clause")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suggestedActionItem: ActionPlanItem = {
    id: `action-compare-${index}-${changeSlug || "clause"}`,
    title: suggestedActionTitle,
    explanation: suggestedActionExplanation,
    actionType: "clarify",
    priority: significance === "HIGH" ? "urgent" : significance === "MEDIUM" ? "important" : "recommended",
    clauseSection: currentSection || previousSection || "Section",
    isReversible: true,
    completed: false,
    practicalAdvice: whatToAsk,
  };

  return {
    id: `change-${index}-${(clauseTitle || "clause").toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    clauseTitle,
    category,
    previousClause,
    currentClause,
    previousSection,
    currentSection,
    changeType,
    significance,
    significanceExplanation,
    summary,
    whatChanged: {
      original: originalText,
      revised: revisedText,
    },
    whyItMatters,
    whatToVerify,
    whatToAsk,
    impacts,
    suggestedActionItem,
    suggestedAskQuestion,
    semanticDetails: semanticDetails.length > 0 ? semanticDetails : undefined,
  };
}

/**
 * Analyzes all matched pairs and generates a prioritized comparison list
 */
export function analyzeAllClauseDifferences(
  pairs: MatchedClausePair[],
  isIndianJurisdiction: boolean = true
): ClauseComparisonItem[] {
  return pairs.map((pair, idx) => analyzeClauseDifference(pair, idx, isIndianJurisdiction));
}
