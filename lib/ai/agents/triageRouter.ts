import { getGeminiClient } from "../gemini";

export interface TriageInput {
  rawContent: string;
  sourceType: "file_upload" | "text_input" | "situation_description";
  mimeType?: string;
}

export interface TriageDecision {
  workflow: "document_review" | "situation_navigator" | "version_compare";
  detectedCategory: string;
  suggestedJurisdiction?: string;
  isSanitized: boolean;
  priorityLevel: "standard" | "urgent";
}

/**
 * Triage Router
 * Evaluates incoming user inputs, determines optimal pipeline,
 * and extracts preliminary categorization.
 */
export async function routeIncomingInput(
  input: TriageInput
): Promise<TriageDecision> {
  const gemini = getGeminiClient();

  if (!gemini) {
    // Graceful fallback heuristics when API key is not configured
    const isDocument =
      input.sourceType === "file_upload" ||
      input.rawContent.toLowerCase().includes("agreement") ||
      input.rawContent.toLowerCase().includes("section");

    return {
      workflow: isDocument ? "document_review" : "situation_navigator",
      detectedCategory: isDocument ? "commercial_contract" : "general_inquiry",
      isSanitized: true,
      priorityLevel: "standard",
    };
  }

  // Gemini structured triage logic can be plugged in here
  return {
    workflow: input.sourceType === "situation_description" ? "situation_navigator" : "document_review",
    detectedCategory: "contract_review",
    isSanitized: true,
    priorityLevel: "standard",
  };
}
