import type {
  ActionPlan,
  ActionPlanItem,
  ActionPlanTrigger,
  EvidenceChain,
  Finding,
  KeyDate,
} from "@/types";
import { sanitizeActionItem } from "@/lib/ai/prompts/actionPlanning";

export interface ActionPlanningInput {
  documentId: string;
  documentTitle?: string;
  documentSummary: string;
  parties?: string[];
  jurisdiction?: string;
  findings: Finding[];
  evidenceChains?: EvidenceChain[];
  keyDates?: KeyDate[];
}

/**
 * Generates a stable, deterministic, unique action item ID based on document, category, discriminator, and finding.
 */
export function buildActionItemId(
  documentId: string | undefined,
  category: string,
  discriminator: string,
  findingId?: string
): string {
  const sanitize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const docSlug = documentId ? sanitize(documentId).slice(-16) : "doc";
  const catSlug = sanitize(category);
  const findSlug = findingId ? sanitize(findingId).slice(-24) : "gen";
  const discSlug = sanitize(discriminator);
  return `act_${docSlug}_${catSlug}_${findSlug}_${discSlug}`;
}

/**
 * Validates that every ActionPlan item ID across all categories is strictly unique.
 * Throws in test environment; logs error in production.
 */
export function assertUniqueActionIds(plan: ActionPlan): {
  valid: boolean;
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  const allItems: ActionPlanItem[] = [
    ...plan.urgentItems,
    ...plan.beforeSigning,
    ...plan.questionsToAsk,
    ...plan.documentsToCollect,
    ...plan.factsToConfirm,
    ...plan.followUpItems,
  ];

  for (const item of allItems) {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    } else {
      seen.add(item.id);
    }
  }

  if (duplicates.size > 0) {
    const dupeArray = Array.from(duplicates);
    const msg = `ActionPlan invariant violation: Found ${dupeArray.length} duplicate action item ID(s): ${dupeArray.join(", ")}`;
    if (process.env.NODE_ENV === "test") {
      throw new Error(msg);
    } else {
      console.error(msg);
    }
    return { valid: false, duplicates: dupeArray };
  }

  return { valid: true, duplicates: [] };
}

/**
 * Sanitizes all items against dangerous directives, deduplicates globally across categories,
 * and guarantees 100% unique IDs across the entire ActionPlan.
 */
export function sanitizeAndDeduplicateActionPlan(plan: ActionPlan): ActionPlan {
  const seenIds = new Set<string>();
  const seenActionKeys = new Set<string>();

  const dedupeItems = (items: ActionPlanItem[]): ActionPlanItem[] => {
    return items
      .map(sanitizeActionItem)
      .filter((item) => {
        // Semantic deduplication: findingId + actionType + normalized title
        const normalizedTitle = item.title.trim().toLowerCase();
        const actionKey = `${item.findingId || "gen"}::${item.actionType}::${normalizedTitle}`;

        if (seenActionKeys.has(actionKey)) {
          return false;
        }
        seenActionKeys.add(actionKey);

        // ID uniqueness guarantee across the whole plan
        if (seenIds.has(item.id)) {
          let suffix = 2;
          while (seenIds.has(`${item.id}-${suffix}`)) {
            suffix++;
          }
          item.id = `${item.id}-${suffix}`;
        }
        seenIds.add(item.id);

        return true;
      });
  };

  const urgentItems = dedupeItems(plan.urgentItems);
  const beforeSigning = dedupeItems(plan.beforeSigning);
  const questionsToAsk = dedupeItems(plan.questionsToAsk);
  const documentsToCollect = dedupeItems(plan.documentsToCollect);
  const factsToConfirm = dedupeItems(plan.factsToConfirm);
  const followUpItems = dedupeItems(plan.followUpItems);

  // Deduplicate professionalReviewTriggers
  const seenTriggerKeys = new Set<string>();
  const professionalReviewTriggers = plan.professionalReviewTriggers.filter((t) => {
    const key = `${t.findingId}::${t.clauseSection}`;
    if (seenTriggerKeys.has(key)) return false;
    seenTriggerKeys.add(key);
    return true;
  });

  const dedupedPlan: ActionPlan = {
    ...plan,
    urgentItems,
    beforeSigning,
    questionsToAsk,
    documentsToCollect,
    factsToConfirm,
    professionalReviewTriggers,
    followUpItems,
  };

  // Run validation invariant
  assertUniqueActionIds(dedupedPlan);

  return dedupedPlan;
}

/**
 * Deterministic generator that maps findings, evidence chains, and dates into
 * structured, safe, and actionable categories.
 */
export function generateDeterministicActionPlan(
  input: ActionPlanningInput
): ActionPlan {
  const urgentItems: ActionPlanItem[] = [];
  const beforeSigning: ActionPlanItem[] = [];
  const questionsToAsk: ActionPlanItem[] = [];
  const documentsToCollect: ActionPlanItem[] = [];
  const factsToConfirm: ActionPlanItem[] = [];
  const professionalReviewTriggers: ActionPlanTrigger[] = [];
  const followUpItems: ActionPlanItem[] = [];

  const findings = input.findings || [];
  const keyDates = input.keyDates || [];
  const _evidenceChains = input.evidenceChains || [];

  // Map each finding to practical, reversible preparation actions
  findings.forEach((finding, index) => {
    const isHigh = finding.severity === "high_attention" || finding.severity === "critical_attention";
    const isMedium = finding.severity === "review";
    const clauseRef = finding.clauseReference || {
      section: finding.evidence?.section || `Section ${index + 1}`,
      clauseId: finding.clauseId || finding.evidence?.clauseId,
      pageNumber: finding.evidence?.pageNumber ?? null,
    };
    const clauseSec = clauseRef.section || `Section ${index + 1}`;
    const pageNum = clauseRef.pageNumber ?? null;
    const lowerTitle = finding.title.toLowerCase();

    const isRestrictiveCovenant =
      lowerTitle.includes("non-compete") ||
      lowerTitle.includes("restrictive") ||
      lowerTitle.includes("competing") ||
      lowerTitle.includes("restriction") ||
      finding.category.toLowerCase().includes("restriction");
    const isTraining =
      lowerTitle.includes("training") ||
      lowerTitle.includes("reimbursement") ||
      lowerTitle.includes("clawback") ||
      finding.category.toLowerCase().includes("payment") ||
      finding.category.toLowerCase().includes("financial");
    const isIp =
      lowerTitle.includes("invention") ||
      lowerTitle.includes("intellectual property") ||
      lowerTitle.includes("ip") ||
      finding.category.toLowerCase().includes("intellectual");

    // 1. Professional Review Triggers
    if (isHigh || isRestrictiveCovenant || isTraining || isIp) {
      professionalReviewTriggers.push({
        id: `trigger-${finding.id}`,
        findingId: finding.id,
        clauseSection: clauseSec,
        reason: isHigh
          ? `High-risk finding: ${finding.title}. Potential one-sided liability or statutory restriction deserves attorney review.`
          : `Important covenant: ${finding.title}. Enforceability depends heavily on local governing law standards.`,
        severity: finding.severity,
      });
    }

    // 2. Questions to Ask Counterparty / HR / Drafting Party
    questionsToAsk.push(
      sanitizeActionItem({
        id: buildActionItemId(input.documentId, "questions", "clarify", finding.id),
        title: `Clarify ${finding.title} with drafting party`,
        explanation: `Ask the drafting party to explain the intended operational scope of ${clauseSec} before execution.`,
        actionType: "ask_party",
        priority: isHigh ? "urgent" : isMedium ? "important" : "recommended",
        findingId: finding.id,
        findingTitle: finding.title,
        clauseId: clauseRef?.clauseId,
        clauseSection: clauseSec,
        pageNumber: pageNum,
        isReversible: true,
        practicalAdvice: finding.actionableAdvice || `Request clarification in writing: "Could you confirm the intended scope and specific exceptions under ${clauseSec}?"`,
      })
    );

    // 3. Specific finding-type actions
    if (isRestrictiveCovenant) {
      beforeSigning.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "before-signing", "nc-narrow", finding.id),
          title: "Request narrowing of non-compete geographic & temporal scope",
          explanation: `The current clause restricts competitive activity broadly. Ask drafting party to specify exact direct competitors and reduce the duration.`,
          actionType: "clarify",
          priority: "urgent",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Propose limiting restrictions to named competitors rather than the entire industry, and reduce duration to 6 months.",
        })
      );

      factsToConfirm.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "facts", "nc-fact", finding.id),
          title: "Confirm primary territory and prospective client boundaries",
          explanation: "Clarify whether remote work or out-of-state accounts are treated as competitive activity.",
          actionType: "confirm_fact",
          priority: "important",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Define exactly which physical territories or named customer accounts apply to you.",
        })
      );
    } else if (isTraining) {
      beforeSigning.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "before-signing", "train-cap", finding.id),
          title: "Request pro-rata monthly amortization for training repayment",
          explanation: "The current clawback requires 100% repayment even if you depart in month 23. Request pro-rata reduction.",
          actionType: "clarify",
          priority: "urgent",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Propose: 'Repayment shall amortize pro-rata by 1/12th per completed month of continuous service.'",
        })
      );

      documentsToCollect.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "documents", "train-doc", finding.id),
          title: "Collect itemized receipts and written notices of approved training costs",
          explanation: "Ensure that only actual, third-party expenses paid by the employer can be claimed for reimbursement.",
          actionType: "collect_document",
          priority: "important",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Request an upfront written statement of eligible training programs and maximum reimbursable amounts.",
        })
      );
    } else if (isIp) {
      beforeSigning.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "before-signing", "ip-exhibit", finding.id),
          title: "Attach written Exhibit A listing all pre-existing inventions",
          explanation: "Under broad invention assignment clauses, any personal projects created prior to signing could be claimed unless explicitly excluded.",
          actionType: "preserve_evidence",
          priority: "urgent",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Document all personal code repositories, open-source projects, and domain names on Exhibit A before signing.",
        })
      );

      documentsToCollect.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "documents", "ip-doc", finding.id),
          title: "Gather repository commit logs and records of personal side projects",
          explanation: "Establish a clear verifiable timestamp of work completed independently outside company hours and company devices.",
          actionType: "collect_document",
          priority: "important",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Export Git commit logs and initial creation dates to substantiate pre-existing ownership.",
        })
      );
    } else if (lowerTitle.includes("arbitration") || lowerTitle.includes("dispute")) {
      factsToConfirm.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "facts", "arb-fact", finding.id),
          title: "Confirm whether employer pays arbitration forum fees",
          explanation: "Under Delaware and federal arbitration standards, agreements requiring employees to split steep forum fees may be challenged as unconscionable.",
          actionType: "confirm_fact",
          priority: "important",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Request clarification on AAA/JAMS fee allocations and confirm fee-shifting is mutual.",
        })
      );
    } else {
      // General finding
      beforeSigning.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "before-signing", `general-${index}`, finding.id),
          title: `Verify terms for ${finding.title}`,
          explanation: finding.plainEnglishSummary || finding.whyItMatters || finding.description || "Review finding terms before signing.",
          actionType: "clarify",
          priority: isHigh ? "urgent" : isMedium ? "important" : "recommended",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: finding.actionableAdvice || "Review with drafting party before signing.",
        })
      );
    }
  });

  // 4. Integrate Key Dates into Deadlines & Follow-ups
  keyDates.forEach((kd, idx) => {
    const isDeadline = kd.isDeadline || !!kd.noticePeriodDays;
    const isImmediate = kd.date && new Date(kd.date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && new Date(kd.date).getTime() > Date.now();

    const dateAction: ActionPlanItem = sanitizeActionItem({
      id: buildActionItemId(input.documentId, isImmediate ? "urgent" : "followup", `date-${idx}`),
      title: `Monitor deadline: ${kd.label}`,
      explanation: `${kd.description}${kd.noticePeriodDays ? ` (Notice period: ${kd.noticePeriodDays} days)` : ""}`,
      actionType: "monitor_deadline",
      priority: isImmediate ? "urgent" : isDeadline ? "important" : "recommended",
      clauseSection: kd.clauseReference?.section,
      pageNumber: kd.clauseReference?.pageNumber ?? null,
      isReversible: true,
      practicalAdvice: kd.noticePeriodDays
        ? `Calendar a reminder at least ${kd.noticePeriodDays + 14} days prior to deadline to prepare written notice.`
        : "Set a calendar reminder for this milestone.",
    });

    if (isImmediate) {
      urgentItems.push(dateAction);
    } else {
      followUpItems.push(dateAction);
    }
  });

  // 5. If urgentItems is empty, elevate any high-priority pre-signing items (MOVE, do not clone)
  if (urgentItems.length === 0) {
    const urgentCandidateIndex = beforeSigning.findIndex((item) => item.priority === "urgent");
    if (urgentCandidateIndex !== -1) {
      const [candidate] = beforeSigning.splice(urgentCandidateIndex, 1);
      candidate.id = buildActionItemId(
        input.documentId,
        "urgent",
        candidate.id.split("_").pop() || "elevated",
        candidate.findingId
      );
      urgentItems.push(candidate);
    }
  }

  // 6. Ensure default documents to collect if sparse
  if (documentsToCollect.length === 0) {
    documentsToCollect.push(
      sanitizeActionItem({
        id: buildActionItemId(input.documentId, "documents", "default-offer"),
        title: "Collect original offer letter and written job description",
        explanation: "Compare representations made during hiring with contractual duties and compensation terms.",
        actionType: "collect_document",
        priority: "important",
        isReversible: true,
        practicalAdvice: "Maintain a dedicated offline folder with all pre-execution emails and offer letters.",
      })
    );
  }

  const rawPlan: ActionPlan = {
    id: `action-plan-${Date.now()}`,
    documentId: input.documentId,
    summary: `Preparation action plan with ${urgentItems.length} urgent, ${beforeSigning.length} pre-signing, and ${questionsToAsk.length} clarification questions across ${findings.length} findings.`,
    urgentItems,
    beforeSigning,
    questionsToAsk,
    documentsToCollect,
    factsToConfirm,
    professionalReviewTriggers,
    followUpItems,
    generatedAt: new Date().toISOString(),
  };

  return sanitizeAndDeduplicateActionPlan(rawPlan);
}
