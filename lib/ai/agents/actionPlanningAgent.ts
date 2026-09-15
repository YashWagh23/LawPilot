import { getGeminiClient, GEMINI_CONFIG } from "@/lib/ai/gemini";
import type {
  ActionItem,
  ActionPlan,
  LawyerBrief,
} from "@/types";
import {
  ACTION_PLAN_SYSTEM_PROMPT,
  ActionPlanSchema,
} from "@/lib/ai/prompts/actionPlanning";

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
