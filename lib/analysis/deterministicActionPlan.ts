import type {
  ActionPlan,
  ActionPlanItem,
  ActionPlanTrigger,
  EvidenceChain,
  Finding,
  KeyDate,
} from "@/types";
import type { AiRunTracker } from "@/lib/ai/gemini";
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
  documentType?: string;
  tracker?: AiRunTracker;
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

  const firstByKey = new Map<string, ActionPlanItem>();

  const dedupeItems = (items: ActionPlanItem[]): ActionPlanItem[] => {
    return items
      .map(sanitizeActionItem)
      .filter((item) => {
        // Semantic deduplication: the same step (type + title) is shown once even when several
        // findings produce it; the surviving step lists every clause it applies to.
        const normalizedTitle = item.title.trim().toLowerCase().replace(/\s+/g, " ");
        const actionKey = `${item.actionType}::${normalizedTitle}`;

        if (seenActionKeys.has(actionKey)) {
          const kept = firstByKey.get(actionKey);
          if (kept && item.clauseSection && !(kept.clauseSection || "").includes(item.clauseSection)) {
            kept.clauseSection = kept.clauseSection ? `${kept.clauseSection}, ${item.clauseSection}` : item.clauseSection;
          }
          return false;
        }
        seenActionKeys.add(actionKey);
        firstByKey.set(actionKey, item);

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

  const isEmploymentDoc = !input.documentType || input.documentType === "employment_agreement";
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

    const catLowerAP = finding.category.toLowerCase();
    const isRestrictiveCovenant =
      /non-?compet|restrictive|competing|restriction|non-?solicit|exclusivity/.test(lowerTitle) ||
      catLowerAP.includes("restrictive");
    const isTraining =
      /\btraining\b|reimbursement|clawback|exit financial/.test(lowerTitle) ||
      catLowerAP.includes("financial & termination");
    const isIp =
      /\binventions?\b|intellectual property|\bownership allocation\b/.test(lowerTitle) ||
      catLowerAP.includes("intellectual");
    const isArbitration = /arbitration|dispute resolution|court forum/.test(lowerTitle);
    const shortTitle = finding.title.replace(/\s+deserves review$/i, "").replace(/\s*\(Section [^)]+\)$/i, "");

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

    // 2. Questions to Ask Counterparty / Drafting Party: specific to what is unclear in THIS finding
    const firstUncertainty = (finding.uncertainties || []).find((u) => u && u.trim().length > 10);
    const specificQuestion = firstUncertainty
      ? `Could you confirm ${firstUncertainty.trim().replace(/^./, (c) => c.toLowerCase()).replace(/[.]+$/, "")}?`
      : `Could you confirm the intended scope and specific exceptions under ${clauseSec}?`;
    questionsToAsk.push(
      sanitizeActionItem({
        id: buildActionItemId(input.documentId, "questions", "clarify", finding.id),
        title: `Ask about ${clauseSec}: ${shortTitle}`,
        explanation: `Get the drafting party's written position on what ${clauseSec} is intended to cover before you rely on it.`,
        actionType: "ask_party",
        priority: isHigh ? "urgent" : isMedium ? "important" : "recommended",
        findingId: finding.id,
        findingTitle: finding.title,
        clauseId: clauseRef?.clauseId,
        clauseSection: clauseSec,
        pageNumber: pageNum,
        isReversible: true,
        practicalAdvice: finding.actionableAdvice || `Ask in writing: "${specificQuestion}"`,
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
          practicalAdvice: "Propose limiting restrictions to named competitors or clients rather than the entire industry, with a shorter, clearly defined duration.",
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
          explanation: "The clause may require full repayment even late in the stated period. Ask for a pro-rata reduction for each completed period of service.",
          actionType: "clarify",
          priority: "urgent",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Propose that the repayment amortize pro-rata for each completed month of continuous service.",
        })
      );

      documentsToCollect.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "documents", "train-doc", finding.id),
          title: "Collect itemized receipts and written notices of approved training costs",
          explanation: "Ensure that only actual, documented third-party expenses can be claimed for reimbursement.",
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
          title: "Attach a written Exhibit A listing pre-existing work to exclude",
          explanation: "Under broad assignment clauses, pre-existing work could be claimed unless it is explicitly excluded.",
          actionType: "preserve_evidence",
          priority: "urgent",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "List personal projects, code repositories and other pre-existing work on an exhibit before signing.",
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
    } else if (isArbitration) {
      factsToConfirm.push(
        sanitizeActionItem({
          id: buildActionItemId(input.documentId, "facts", "arb-fact", finding.id),
          title: "Confirm who pays arbitration forum fees",
          explanation: "Forum and arbitrator fees can be costly; how they are allocated affects whether pursuing a claim is practical.",
          actionType: "confirm_fact",
          priority: "important",
          findingId: finding.id,
          findingTitle: finding.title,
          clauseId: clauseRef?.clauseId,
          clauseSection: clauseSec,
          pageNumber: pageNum,
          isReversible: true,
          practicalAdvice: "Request clarification of how forum and arbitrator fees are allocated and whether fee-shifting is mutual.",
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
        title: isEmploymentDoc ? "Collect original offer letter and written job description" : "Collect the signed agreement, amendments and related correspondence",
        explanation: isEmploymentDoc
          ? "Compare representations made during hiring with contractual duties and compensation terms."
          : "Compare what was discussed or promised with what the written terms actually say.",
        actionType: "collect_document",
        priority: "important",
        isReversible: true,
        practicalAdvice: "Keep a dedicated offline folder with the agreement, amendments and all pre-signing correspondence.",
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
