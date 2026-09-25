import { generateJson, isGeminiConfigured } from "@/lib/ai/gemini";
import type {
  ActionItem,
  ActionPlan,
  LawyerBrief,
} from "@/types";
import {
  ACTION_PLAN_SYSTEM_PROMPT,
  ActionPlanItemSchema,
  ActionPlanTriggerSchema,
} from "@/lib/ai/prompts/actionPlanning";
import { z } from "zod";

/**
 * What we require from the model. Identifiers, timestamps and the summary are set by code (models
 * routinely omit them), and individual malformed items are dropped instead of failing the plan.
 */
const LooseItem = ActionPlanItemSchema.partial({ id: true, isReversible: true, completed: true });
const LiveActionPlanSchema = z.object({
  summary: z.string().nullish().catch(null),
  urgentItems: z.array(LooseItem).catch([]),
  beforeSigning: z.array(LooseItem).catch([]),
  questionsToAsk: z.array(LooseItem).catch([]),
  documentsToCollect: z.array(LooseItem).catch([]),
  factsToConfirm: z.array(LooseItem).catch([]),
  professionalReviewTriggers: z.array(ActionPlanTriggerSchema.partial({ id: true })).catch([]),
  followUpItems: z.array(LooseItem).catch([]),
});

import {
  generateDeterministicActionPlan,
  sanitizeAndDeduplicateActionPlan,
  buildActionItemId,
  assertUniqueActionIds,
  type ActionPlanningInput,
} from "@/lib/analysis/deterministicActionPlan";

export {
  generateDeterministicActionPlan,
  sanitizeAndDeduplicateActionPlan,
  buildActionItemId,
  assertUniqueActionIds,
  type ActionPlanningInput,
};

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
  const baseline = generateDeterministicActionPlan(input);
  if (!isGeminiConfigured()) return baseline;

  const prompt = `${ACTION_PLAN_SYSTEM_PROMPT}

Generate a comprehensive ActionPlan for the following document analysis:
Document ID: ${input.documentId}
Document Title: ${input.documentTitle || "Legal Document"}
Document Type: ${input.documentType || "agreement"}
Summary: ${input.documentSummary}
Jurisdiction: ${input.jurisdiction || "Unspecified"}
Parties: ${(input.parties || []).join(", ") || "Unspecified"}

<untrusted_document_context>
FINDINGS:
${JSON.stringify(
  input.findings.map((f) => ({
    id: f.id,
    title: f.title,
    category: f.category,
    severity: f.severity,
    summary: f.plainEnglishSummary || f.description,
    section: f.clauseReference?.section || f.evidence?.section,
  })),
  null,
  2
)}

KEY DATES & DEADLINES:
${JSON.stringify(input.keyDates || [], null, 2)}
</untrusted_document_context>

Rules: every item's findingId MUST be one of the finding ids above. Each step must be distinct — never emit two steps with the same or near-identical title. Do not assume an employment relationship unless the document type says so.
Return a single valid JSON object adhering strictly to the ActionPlan schema.`;

  const result = await generateJson({
    label: "action-plan",
    contents: prompt,
    schema: LiveActionPlanSchema,
    temperature: 0.1,
    maxOutputTokens: 8192,
    totalTimeoutMs: 18_000,
    attemptTimeoutMs: 14_000,
    tracker: input.tracker,
  });

  if (!result.ok) return baseline;

  const validIds = new Set(input.findings.map((f) => f.id));
  const live = result.data;
  const withIds = (items: z.infer<typeof LooseItem>[], group: string) =>
    items.map((item, idx) => ({
      ...item,
      id: item.id || buildActionItemId(input.documentId, group, `ai-${idx}`, item.findingId),
      isReversible: true,
      completed: false,
    }));
  const plan: ActionPlan = {
    id: `action-plan-${Date.now()}`,
    documentId: input.documentId,
    summary: live.summary || baseline.summary,
    urgentItems: withIds(live.urgentItems, "urgent"),
    beforeSigning: withIds(live.beforeSigning, "before-signing"),
    questionsToAsk: withIds(live.questionsToAsk, "questions"),
    documentsToCollect: withIds(live.documentsToCollect, "documents"),
    factsToConfirm: withIds(live.factsToConfirm, "facts"),
    professionalReviewTriggers: live.professionalReviewTriggers.map((t, i) => ({ ...t, id: t.id || `trigger-ai-${i}` })),
    followUpItems: withIds(live.followUpItems, "followup"),
    generatedAt: new Date().toISOString(),
  };
  // Reject plans that reference findings that do not exist, or that are empty.
  const items = [plan.urgentItems, plan.beforeSigning, plan.questionsToAsk, plan.documentsToCollect, plan.factsToConfirm, plan.followUpItems].flat();
  if (items.length === 0 || items.some((i) => i.findingId && !validIds.has(i.findingId))) {
    return baseline;
  }
  // Deadlines come from the document, not the model: keep the deterministic monitor-deadline steps.
  plan.followUpItems = [...plan.followUpItems, ...baseline.followUpItems.filter((i) => i.actionType === "monitor_deadline")];
  plan.urgentItems = [...plan.urgentItems, ...baseline.urgentItems.filter((i) => i.actionType === "monitor_deadline")];
  return sanitizeAndDeduplicateActionPlan(plan);
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
