import { generateJson, isGeminiConfigured } from "@/lib/ai/gemini";
import type { DetailedLawyerBrief } from "@/types";
import { LAWYER_BRIEF_SYSTEM_PROMPT } from "@/lib/ai/prompts/lawyerBrief";
import { z } from "zod";

/** Only the narrative sections are taken from the model; everything else comes from the analysis. */
const LiveBriefSchema = z.object({
  matterSummary: z.string().min(10),
  userConcerns: z.array(z.string()).catch([]),
  whatRemainsUncertain: z.array(z.string()).catch([]),
  documentsAvailable: z.array(z.string()).catch([]),
  questionsForCounsel: z
    .array(
      z.object({
        findingId: z.string(),
        clauseReference: z.string().catch(""),
        question: z.string().min(5),
        context: z.string().catch(""),
      })
    )
    .catch([]),
  verifiedLegalContext: z
    .array(z.object({ citation: z.string() }))
    .catch([]),
});

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
 *
 * The deterministic brief is the grounded baseline. Live AI may improve the narrative sections,
 * but anything that must stay verifiable (clauses, legal citations, dates, uncertainties) is
 * taken from, or checked against, the analysis itself — never from model memory.
 */
export async function generateDetailedLawyerBrief(
  input: DetailedLawyerBriefInput
): Promise<DetailedLawyerBrief> {
  const baseline = generateDeterministicLawyerBrief(input);
  if (!isGeminiConfigured()) return baseline;

  const prompt = `${LAWYER_BRIEF_SYSTEM_PROMPT}

Generate a 1-2 page DetailedLawyerBrief for legal counsel:

<untrusted_document_context>
Document Title: ${input.documentTitle}
Document Type: ${input.documentType}
Date: ${input.date || "Not specified"}
Parties: ${input.parties.join(", ") || "Not specified"}
Jurisdiction: ${input.jurisdiction || "Not established by the document"}
Document Summary: ${input.documentSummary}

FINDINGS & SEVERITY (findingId is required in questionsForCounsel):
${JSON.stringify(
  input.findings.map((f) => ({
    findingId: f.id,
    title: f.title,
    severity: f.severity,
    clauseReference: f.clauseReference?.section || f.evidence?.section,
    plainEnglishSummary: f.plainEnglishSummary || f.whyItMatters || f.description,
  })),
  null,
  2
)}

VERIFIED EVIDENCE CHAINS (the ONLY legal sources you may cite):
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
</untrusted_document_context>

If no verified evidence chain lists a legal source, verifiedLegalContext must be an empty array.
Return a single valid JSON object adhering strictly to the DetailedLawyerBrief schema.`;

  const result = await generateJson({
    label: "lawyer-brief",
    contents: prompt,
    schema: LiveBriefSchema,
    temperature: 0.1,
    maxOutputTokens: 8192,
    totalTimeoutMs: 18_000,
    attemptTimeoutMs: 14_000,
    tracker: input.tracker,
  });

  if (!result.ok) return baseline;

  const ai = result.data;
  const knownFindingIds = new Set(input.findings.map((f) => f.id));

  return {
    ...baseline,
    // Narrative sections from the model…
    matterSummary: ai.matterSummary,
    userConcerns: ai.userConcerns.length > 0 ? ai.userConcerns : baseline.userConcerns,
    whatRemainsUncertain:
      ai.whatRemainsUncertain.length > 0
        ? Array.from(new Set([...ai.whatRemainsUncertain, ...baseline.whatRemainsUncertain])).slice(0, 12)
        : baseline.whatRemainsUncertain,
    documentsAvailable: ai.documentsAvailable.length > 0 ? ai.documentsAvailable : baseline.documentsAvailable,
    // …but only questions tied to real findings, and only legal context that matches a real source.
    questionsForCounsel: (() => {
      const byFinding = new Map(baseline.questionsForCounsel.map((q) => [q.findingId, q]));
      const grounded = ai.questionsForCounsel
        .filter((q) => knownFindingIds.has(q.findingId))
        .map((q) => ({
          findingId: q.findingId,
          clauseReference: q.clauseReference || byFinding.get(q.findingId)?.clauseReference || "the applicable section",
          question: q.question,
          context: q.context || byFinding.get(q.findingId)?.context || "",
        }));
      return grounded.length > 0 ? grounded : baseline.questionsForCounsel;
    })(),
    // Legal context is only ever the verified evidence-chain sources (the model may not add any).
    verifiedLegalContext: baseline.verifiedLegalContext,
    // Clauses, dates and the disclaimer always come from the analysis itself.
  };
}
