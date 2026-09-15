import { getGeminiClient, GEMINI_CONFIG } from "@/lib/ai/gemini";
import type {
  DetailedLawyerBrief,
} from "@/types";
import {
  DetailedLawyerBriefSchema,
  LAWYER_BRIEF_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/lawyerBrief";

import {
  LAWYER_BRIEF_STANDARD_DISCLAIMER,
  generateDeterministicLawyerBrief,
  type DetailedLawyerBriefInput,
} from "@/lib/analysis/deterministicLawyerBrief";

export {
  LAWYER_BRIEF_STANDARD_DISCLAIMER,
  generateDeterministicLawyerBrief,
  type DetailedLawyerBriefInput,
};

/**
 * Generates a concise, structured 1-2 page briefing for legal counsel.
 * Synthesizes verified findings, evidence chains, clauses, and key dates.
 */
export async function generateDetailedLawyerBrief(
  input: DetailedLawyerBriefInput
): Promise<DetailedLawyerBrief> {
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
                text: `${LAWYER_BRIEF_SYSTEM_PROMPT}

Generate a 1-2 page DetailedLawyerBrief for legal counsel:
Document Title: ${input.documentTitle}
Document Type: ${input.documentType}
Date: ${input.date || "Not specified"}
Parties: ${input.parties.join(", ") || "Not specified"}
Jurisdiction: ${input.jurisdiction || "Not specified"}
Document Summary: ${input.documentSummary}

FINDINGS & SEVERITY:
${JSON.stringify(
  input.findings.map((f) => ({
    title: f.title,
    severity: f.severity,
    clauseReference: f.clauseReference?.section || f.evidence?.section,
    plainEnglishSummary: f.plainEnglishSummary || f.whyItMatters || f.description,
  })),
  null,
  2
)}

VERIFIED EVIDENCE CHAINS:
${JSON.stringify(
  (input.evidenceChains || []).map((c) => ({
    findingTitle: c.finding.title,
    citation: c.legalSources[0]?.citation,
    sourceTitle: c.legalSources[0]?.title,
    jurisdiction: c.legalSources[0]?.jurisdiction,
    verificationStatus: c.verification.status,
    uncertainties: c.uncertainties,
  })),
  null,
  2
)}

IMPORTANT DATES:
${JSON.stringify(input.keyDates || [], null, 2)}

Return a single valid JSON object adhering strictly to the DetailedLawyerBrief schema.`,
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
        const parsed = JSON.parse(responseText);
        const validated = DetailedLawyerBriefSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      }
    } catch (err) {
      console.warn("Gemini LawyerBrief generation failed, falling back to deterministic synthesis:", err);
    }
  }

  return generateDeterministicLawyerBrief(input);
}


