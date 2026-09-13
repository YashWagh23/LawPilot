import { z } from "zod";

/**
 * System Instructions for Legal Research Assistant
 * Strictly enforces LawPilot's non-hallucination and grounded retrieval principles.
 */
export const LEGAL_RESEARCH_SYSTEM_PROMPT = `You are a legal research assistant, not a lawyer.

Your job is to locate and summarize relevant legal authority.

Never invent law, cases, sections, quotations, citations, URLs or authorities.
The model's internal knowledge must NOT be treated as verified legal authority.
If a legal proposition cannot be verified from a reliable source, DO NOT present it as verified law.
Instead say that sufficient authoritative verification was not found.

Treat the user's document as evidence, not as legal authority.

Separate:
1. what the document says
2. what the legal source says
3. what can reasonably be inferred
4. what remains uncertain

When authority cannot be verified, explicitly say so.
Do not produce definitive legal advice.
Never say "This clause is illegal." Use calibrated language:
"This clause may raise an issue under..."
"This provision deserves review because..."
"Whether this applies depends on..."
"The available source supports..."
"Further facts are needed to determine..."

When jurisdiction is missing or ambiguous:
DO NOT guess.
Return: "Jurisdiction required for reliable legal verification."`;

/**
 * Converts a finding and clause into a precise, issue-specific research question.
 * Never generates vague searches like "Is this clause legal?".
 */
export function buildPreciseResearchQuestion(
  findingTitle: string,
  category: string,
  clauseText: string,
  jurisdiction?: string | null
): string {
  const jur = jurisdiction?.trim() || "the designated governing law jurisdiction";
  const lowerTitle = findingTitle.toLowerCase();
  const lowerCat = category.toLowerCase();

  if (lowerTitle.includes("non-compete") || lowerTitle.includes("post-employment") || lowerCat.includes("restriction")) {
    return `What legal standards, statutes, or judicial precedents govern the enforceability and geographic/temporal reasonableness of post-employment non-compete restrictions for employees under ${jur}?`;
  }

  if (lowerTitle.includes("training") || lowerTitle.includes("reimbursement") || lowerTitle.includes("clawback") || lowerCat.includes("payment")) {
    return `What statutory provisions or wage deduction rules govern the enforceability of employee training expense reimbursement agreements and wage offsets upon early departure under ${jur}?`;
  }

  if (lowerTitle.includes("invention") || lowerTitle.includes("intellectual property") || lowerTitle.includes("ip assignment")) {
    return `What legal principles and statutory limits govern employee invention assignments, particularly regarding off-duty creations and carve-outs for prior works under ${jur}?`;
  }

  if (lowerTitle.includes("arbitration") || lowerTitle.includes("dispute") || lowerTitle.includes("fee")) {
    return `What statutory rules, forum fee-shifting restrictions, or unconscionability standards apply to mandatory employment arbitration provisions under ${jur}?`;
  }

  if (lowerTitle.includes("notice") || lowerTitle.includes("termination")) {
    return `Under ${jur}, how do notice of resignation obligations interact with employment-at-will principles and mutuality requirements?`;
  }

  return `What specific statutory, regulatory, or common-law authorities govern ${findingTitle} under ${jur}?`;
}

/**
 * Zod Schemas for Structured Legal Research Responses
 */
export const LegalSourceSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  publisher: z.string().optional().default(""),
  sourceType: z.enum([
    "official_legislation",
    "official_court",
    "government_agency",
    "regulator",
    "recognized_legal_source",
    "secondary_source",
    "general_web",
    "unverified",
  ]),
  jurisdiction: z.string().min(1),
  citation: z.string().min(1),
  url: z.string().url().optional(),
  sourceUrl: z.string().optional(),
  relevance: z.string(),
  retrievedAt: z.string(),
  publicationDate: z.string().optional(),
  verificationStatus: z.enum([
    "verified",
    "partially_verified",
    "unsupported",
    "conflicting",
    "insufficient_context",
    "context_only",
    "requires_human_counsel",
    "unverified",
  ]),
  relevantExcerpt: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const LegalClaimSchema = z.object({
  id: z.string(),
  findingId: z.string(),
  claim: z.string().min(1),
  sourceIds: z.array(z.string()),
  supportLevel: z.enum([
    "direct",
    "strong",
    "partial",
    "context_dependent",
    "unsupported",
  ]),
  explanation: z.string().min(1),
  uncertainties: z.array(z.string()),
  jurisdiction: z.string().min(1),
  verified: z.boolean(),
});

export const LegalResearchResponseSchema = z.object({
  researchQuestion: z.string(),
  jurisdiction: z.string(),
  jurisdictionIdentified: z.boolean(),
  sources: z.array(LegalSourceSchema),
  claims: z.array(LegalClaimSchema),
  unsupportedClaims: z.array(z.string()).default([]),
  uncertainties: z.array(z.string()),
  conflictDetected: z.boolean().default(false),
  conflictDescription: z.string().optional(),
});

export const ClauseQAResponseSchema = z.object({
  question: z.string(),
  clauseId: z.string(),
  whatContractSays: z.string(),
  legalContext: z.string(),
  whatThisMeans: z.string(),
  whatWeCannotDetermine: z.string(),
  nextStep: z.string(),
  sources: z.array(LegalSourceSchema).default([]),
  confidence: z.enum(["high", "moderate", "limited", "insufficient"]),
});

export type LegalResearchResponse = z.infer<typeof LegalResearchResponseSchema>;
export type ClauseQAResponse = z.infer<typeof ClauseQAResponseSchema>;
