import { z } from "zod";
import type { ActionPlanItem } from "@/types";

/**
 * System Instructions for the Action Planning Agent (ACT Layer)
 * Strictly enforces LawPilot's preparation-oriented, non-directive safety principles.
 */
export const ACTION_PLAN_SYSTEM_PROMPT = `You are the Action Planning Agent for LawPilot, the AI-powered legal information assistant.
Your tagline is: Understand. Verify. Act.

You are responsible for the ACT layer: turning verified document intelligence and legal context into a structured, practical, and safe preparation workflow.
Your core mission is to answer: "Okay, I understand the document and the issues. What do I actually do next?"

CRITICAL SAFETY RULES:
1. Strictly preparation-oriented: LawPilot provides legal information and preparation assistance, NEVER definitive legal advice or commands.
2. Reversible actions only: You must ONLY suggest actions that prepare the user, clarify ambiguity, collect documents, confirm facts, ask constructive questions, or seek professional review.
3. FORBIDDEN DIRECTIVES:
   - NEVER tell the user to "Terminate the contract", "Sue the counterparty", "Refuse to pay", "Breach the clause", or "Sign the agreement immediately".
   - If an issue is severe, the appropriate action is ALWAYS to "Consult a qualified attorney", "Clarify with the drafting party", or "Preserve relevant records".
4. Every action must link to its underlying finding, clause section, and page number whenever applicable.
5. Do NOT use numerical priority scores (like 1-10 or 85%). Use strictly: "urgent", "important", "recommended", or "optional".
6. Group actions logically into:
   - urgentItems (deadlines within 7 days, immediate risk mitigation, or immediate record preservation)
   - beforeSigning (conditions, clarifications, and checks required before signing)
   - questionsToAsk (concise, polite, professional questions for the employer, HR, or counterparty)
   - documentsToCollect (supporting evidence, prior agreements, job descriptions, employee handbooks)
   - factsToConfirm (dates, monetary amounts, scope, definitions)
   - professionalReviewTriggers (clear criteria for when to engage counsel)
   - followUpItems (timeline milestones, renewal notice windows, calendar reminders)`;

export const ActionItemTypeEnum = z.enum([
  "clarify",
  "collect_document",
  "confirm_fact",
  "ask_party",
  "compare_version",
  "seek_professional_review",
  "monitor_deadline",
  "preserve_evidence",
  "general_preparation",
]);

export const ActionPriorityEnum = z.enum([
  "urgent",
  "important",
  "recommended",
  "optional",
]);

export const ActionPlanItemSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  explanation: z.string().min(5),
  actionType: ActionItemTypeEnum,
  priority: ActionPriorityEnum,
  findingId: z.string().optional(),
  findingTitle: z.string().optional(),
  clauseId: z.string().optional(),
  clauseSection: z.string().optional(),
  pageNumber: z.number().nullable().optional(),
  isReversible: z.boolean().default(true),
  completed: z.boolean().optional().default(false),
  completedAt: z.string().optional(),
  practicalAdvice: z.string().optional(),
});

export const ActionPlanTriggerSchema = z.object({
  id: z.string(),
  findingId: z.string(),
  clauseSection: z.string(),
  reason: z.string(),
  severity: z.enum([
    "critical_attention",
    "high_attention",
    "review",
    "context_dependent",
    "informational",
  ]),
});

export const ActionPlanSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  summary: z.string(),
  urgentItems: z.array(ActionPlanItemSchema),
  beforeSigning: z.array(ActionPlanItemSchema),
  questionsToAsk: z.array(ActionPlanItemSchema),
  documentsToCollect: z.array(ActionPlanItemSchema),
  factsToConfirm: z.array(ActionPlanItemSchema),
  professionalReviewTriggers: z.array(ActionPlanTriggerSchema),
  followUpItems: z.array(ActionPlanItemSchema),
  generatedAt: z.string(),
});

/**
 * Patterns matching dangerous, irreversible directives that violate legal safety boundaries.
 */
const FORBIDDEN_DIRECTIVE_PATTERNS = [
  {
    regex: /\b(terminate|cancel|rescind|break|nullify)\s+(the\s+)?(contract|agreement|lease|employment|deal)\b/i,
    replacementTitle: "Consult legal counsel regarding contract termination options",
    replacementAdvice: "Unilateral termination carries significant liability risks. Seek professional legal review before taking action.",
  },
  {
    regex: /\b(sue|file\s+(a\s+)?lawsuit|take\s+(them|party)\s+to\s+court|litigate)\b/i,
    replacementTitle: "Review dispute resolution mechanisms with counsel",
    replacementAdvice: "Check whether mandatory arbitration or informal mediation is required before initiating legal proceedings.",
  },
  {
    regex: /\b(refuse\s+to\s+pay|withhold\s+(payment|salary|wages)|stop\s+paying)\b/i,
    replacementTitle: "Document disputed payment terms in writing and request clarification",
    replacementAdvice: "Withholding payment may constitute a material breach. Seek written confirmation of disputed charges first.",
  },
  {
    regex: /\b(sign|execute)\s+(the\s+)?(contract|agreement|document)\s+(now|immediately|without\s+delay)\b/i,
    replacementTitle: "Complete all pre-signing verification items prior to execution",
    replacementAdvice: "Ensure all questions are resolved and written revisions are incorporated before signing.",
  },
  {
    regex: /\b(ignore|disregard)\s+(the\s+)?(clause|restriction|covenant|notice)\b/i,
    replacementTitle: "Seek professional legal guidance on enforceability of restrictive provisions",
    replacementAdvice: "Ignoring a contractual covenant can lead to injunctive relief. Verify legal standards before proceeding.",
  },
];

/**
 * Safety gate validator & sanitizer for Action Items.
 * Ensures strict preparation-oriented reversibility and removes aggressive legal commands.
 */
export function sanitizeActionItem(item: ActionPlanItem): ActionPlanItem {
  let sanitizedTitle = item.title;
  let sanitizedExplanation = item.explanation;
  let sanitizedAdvice = item.practicalAdvice || "";

  for (const rule of FORBIDDEN_DIRECTIVE_PATTERNS) {
    if (rule.regex.test(sanitizedTitle)) {
      sanitizedTitle = rule.replacementTitle;
      sanitizedExplanation = `${sanitizedExplanation} (Safety modification: Replaced directive with safe preparation step).`;
      sanitizedAdvice = rule.replacementAdvice;
      break;
    }
    if (rule.regex.test(sanitizedExplanation)) {
      sanitizedExplanation = sanitizedExplanation.replace(rule.regex, "consult counsel regarding options");
    }
  }

  return {
    ...item,
    title: sanitizedTitle,
    explanation: sanitizedExplanation,
    practicalAdvice: sanitizedAdvice,
    isReversible: true, // All LawPilot actions are strictly preparation-oriented and reversible
  };
}
