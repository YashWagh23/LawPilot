import { getGeminiClient, GEMINI_CONFIG } from "@/lib/ai/gemini";
import type {
  ActionItem,
  ActionPlan,
  ActionPlanItem,
  ActionPlanTrigger,
  EvidenceChain,
  Finding,
  KeyDate,
  LawyerBrief,
} from "@/types";
import {
  ACTION_PLAN_SYSTEM_PROMPT,
  ActionPlanSchema,
  sanitizeActionItem,
} from "@/lib/ai/prompts/actionPlanning";

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

export interface ActionPlanningResult {
  actionItems: ActionItem[];
  actionPlan: ActionPlan;
  lawyerBrief: LawyerBrief;
}

/**
 * Generates a structured Action Plan for the ACT layer of LawPilot.
 * Builds on verified document findings, evidence chains, and key dates.
 * Enforces strict reversibility and safety boundaries (no irreversible legal directives).
 */
export async function generateActionPlan(
  input: ActionPlanningInput
): Promise<ActionPlan> {
  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${ACTION_PLAN_SYSTEM_PROMPT}

Generate a comprehensive ActionPlan for the following document analysis:
Document ID: ${input.documentId}
Document Title: ${input.documentTitle || "Legal Document"}
Summary: ${input.documentSummary}
Jurisdiction: ${input.jurisdiction || "Unspecified"}
Parties: ${(input.parties || []).join(", ") || "Unspecified"}

FINDINGS:
${JSON.stringify(
  input.findings.map((f) => ({
    id: f.id,
    title: f.title,
    category: f.category,
    severity: f.severity,
    plainEnglishSummary: f.plainEnglishSummary,
    actionableAdvice: f.actionableAdvice,
    clauseReference: f.clauseReference,
  })),
  null,
  2
)}

KEY DATES & DEADLINES:
${JSON.stringify(input.keyDates || [], null, 2)}

Return a single valid JSON object adhering strictly to the ActionPlan schema.`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        const parsedJson = JSON.parse(responseText);
        const validated = ActionPlanSchema.safeParse(parsedJson);

        if (validated.success) {
          return sanitizeAndDeduplicateActionPlan(validated.data);
        }
      }
    } catch (err) {
      console.warn("Gemini ActionPlan generation failed or timed out, falling back to deterministic synthesis:", err);
    }
  }

  // Deterministic grounded synthesis fallback
  return generateDeterministicActionPlan(input);
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
        id: `action-q-${finding.id}`,
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
          id: `action-nc-narrow-${finding.id}`,
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
          id: `action-nc-fact-${finding.id}`,
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
          id: `action-train-cap-${finding.id}`,
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
          id: `action-train-doc-${finding.id}`,
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
          id: `action-ip-exhibit-${finding.id}`,
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
          id: `action-ip-doc-${finding.id}`,
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
          id: `action-arb-fact-${finding.id}`,
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
          id: `action-general-${finding.id}`,
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
      id: `action-date-${idx}`,
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

  // 5. If urgentItems is empty, elevate any high-priority pre-signing items
  if (urgentItems.length === 0) {
    const urgentCandidate = beforeSigning.find((item) => item.priority === "urgent");
    if (urgentCandidate) {
      urgentItems.push(urgentCandidate);
    }
  }

  // 6. Ensure default documents to collect if sparse
  if (documentsToCollect.length === 0) {
    documentsToCollect.push(
      sanitizeActionItem({
        id: "action-doc-default-offer",
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

/**
 * Sanitizes all items against dangerous directives and removes duplicate action items.
 */
export function sanitizeAndDeduplicateActionPlan(plan: ActionPlan): ActionPlan {
  const filterDedupe = (items: ActionPlanItem[]): ActionPlanItem[] => {
    const seenTitles = new Set<string>();
    return items
      .map(sanitizeActionItem)
      .filter((item) => {
        const key = item.title.trim().toLowerCase();
        if (seenTitles.has(key)) {
          return false;
        }
        seenTitles.add(key);
        return true;
      });
  };

  return {
    ...plan,
    urgentItems: filterDedupe(plan.urgentItems),
    beforeSigning: filterDedupe(plan.beforeSigning),
    questionsToAsk: filterDedupe(plan.questionsToAsk),
    documentsToCollect: filterDedupe(plan.documentsToCollect),
    factsToConfirm: filterDedupe(plan.factsToConfirm),
    followUpItems: filterDedupe(plan.followUpItems),
  };
}

/**
 * Backward-compatible helper that returns legacy ActionItem[] and LawyerBrief,
 * while embedding the new comprehensive ActionPlan.
 */
export async function planActionableSteps(
  input: ActionPlanningInput & { parties: string[] }
): Promise<ActionPlanningResult> {
  const actionPlan = await generateActionPlan(input);

  // Flatten action plan into legacy ActionItem list
  const legacyActionItems: ActionItem[] = [
    ...actionPlan.urgentItems,
    ...actionPlan.beforeSigning,
    ...actionPlan.questionsToAsk,
  ].map((item) => ({
    id: item.id,
    title: item.title,
    description: item.explanation,
    priority: item.priority === "urgent" ? "high" : item.priority === "important" ? "medium" : "low",
    partyResponsible: "User",
    isReversible: item.isReversible,
    recommendedTimeline: item.priority === "urgent" ? "Immediate (Before signing)" : "Prior to closing",
    practicalAdvice: item.practicalAdvice || item.explanation,
  }));

  const lawyerBrief: LawyerBrief = {
    id: `brief-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    documentSummary: input.documentSummary,
    partiesInvolved: input.parties || [],
    keyIssuesToReview: input.findings.map((f) => ({
      issue: f.title,
      clauseReference: f.clauseReference?.section || f.evidence?.section || "Document Clause",
      severity: f.severity,
      recommendedQuestion: `What specific modifications or carve-outs does counsel recommend for ${f.title}?`,
    })),
    missingInformation: actionPlan.factsToConfirm.map((f) => f.title),
    recommendedNegotiationPoints: actionPlan.beforeSigning.map((b) => b.title),
  };

  return {
    actionItems: legacyActionItems,
    actionPlan,
    lawyerBrief,
  };
}
