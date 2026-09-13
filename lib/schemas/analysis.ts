import { z } from "zod";

export const SeverityLevelSchema = z.enum([
  "critical_attention",
  "high_attention",
  "review",
  "context_dependent",
  "informational",
]);

export const ImportanceLevelSchema = SeverityLevelSchema;

export const ConfidenceLevelSchema = z.enum(["high", "moderate", "low"]);

export const VerificationStatusSchema = z.enum([
  "verified",
  "context_only",
  "requires_human_counsel",
  "unverified",
]);

export const ClauseCategorySchema = z.enum([
  "payment",
  "termination",
  "notice",
  "confidentiality",
  "intellectual_property",
  "restriction",
  "indemnity",
  "liability",
  "dispute_resolution",
  "jurisdiction",
  "renewal",
  "employment",
  "obligation",
  "right",
  "data_privacy",
  "general",
  "other",
]);

export const PartySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: z.string(),
  address: z.string().nullable().optional(),
  jurisdiction: z.string().nullable().optional(),
  representationStatus: z
    .enum(["represented", "unrepresented", "unknown"])
    .optional(),
});

export const KeyDateSchema = z.object({
  id: z.string(),
  label: z.string(),
  date: z.string().nullable().optional(),
  description: z.string().optional(),
  noticePeriodDays: z.number().nullable().optional(),
});

export const KeyFinancialTermSchema = z.object({
  id: z.string(),
  label: z.string(),
  amount: z.number().nullable(),
  formattedAmount: z.string(),
  currency: z.string().optional(),
  category: z.enum([
    "salary",
    "fee",
    "deposit",
    "penalty",
    "reimbursement",
    "damages",
    "other",
  ]),
  conditions: z.string().optional(),
});

export const ClauseSchema = z.object({
  id: z.string(),
  section: z.string(),
  title: z.string(),
  rawText: z.string(),
  plainEnglish: z.string(),
  category: ClauseCategorySchema,
  pageNumber: z.number().nullable(),
  importance: ImportanceLevelSchema,
  sectionNumber: z.string().optional(),
  plainEnglishSummary: z.string().optional(),
  highlightedRisk: SeverityLevelSchema.optional(),
});

export const EvidenceLinkSchema = z.object({
  findingId: z.string(),
  documentId: z.string(),
  clauseId: z.string(),
  pageNumber: z.number().nullable(),
  section: z.string(),
  quotedText: z.string(),
});

export const FindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  severity: SeverityLevelSchema,
  description: z.string(),
  whyItMatters: z.string(),
  clauseId: z.string(),
  evidence: EvidenceLinkSchema,
  uncertainties: z.array(z.string()),
  documentId: z.string().optional(),
  summary: z.string().optional(),
  detailedAnalysis: z.string().optional(),
  clauseIds: z.array(z.string()).optional(),
  associatedParties: z.array(z.string()).optional(),
});

export const DocumentExtractionResultSchema = z.object({
  document: z.object({
    title: z.string(),
    documentType: z.enum([
      "employment_agreement",
      "independent_contractor",
      "nda",
      "lease_commercial",
      "lease_residential",
      "services_agreement",
      "general_contract",
    ]),
    effectiveDate: z.string().nullable().optional(),
    executionDate: z.string().nullable().optional(),
    jurisdiction: z.string().nullable().optional(),
    governingLaw: z.string().nullable().optional(),
  }),
  parties: z.array(PartySchema),
  dates: z.array(KeyDateSchema),
  financialTerms: z.array(KeyFinancialTermSchema),
  clauses: z.array(ClauseSchema),
  uncertainties: z.array(z.string()),
});
