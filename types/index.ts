/**
 * LawPilot Domain Type System
 * "Understand. Verify. Act."
 */

export type SeverityLevel =
  | "critical_attention"
  | "high_attention"
  | "review"
  | "context_dependent"
  | "informational";

export type ImportanceLevel = SeverityLevel;

export type ConfidenceLevel = "high" | "moderate" | "low";

export type VerificationStatus =
  | "verified"
  | "context_only"
  | "requires_human_counsel"
  | "unverified";

export type ClauseCategory =
  | "payment"
  | "termination"
  | "notice"
  | "confidentiality"
  | "intellectual_property"
  | "restriction"
  | "indemnity"
  | "liability"
  | "dispute_resolution"
  | "jurisdiction"
  | "renewal"
  | "employment"
  | "obligation"
  | "right"
  | "data_privacy"
  | "general"
  | "other";

export interface Party {
  id: string;
  name: string;
  role: string; // e.g., "Employer", "Employee", "Landlord", "Tenant", "Contractor", "Client"
  address?: string | null;
  jurisdiction?: string | null;
  representationStatus?: "represented" | "unrepresented" | "unknown";
}

export interface KeyDate {
  id: string;
  label: string; // e.g., "Effective Date", "Probation End Date", "Resignation Notice Window"
  date?: string | null;
  description?: string;
  noticePeriodDays?: number | null;
}

export interface KeyFinancialTerm {
  id: string;
  label: string; // e.g., "Base Salary", "Training Fee Reimbursement", "Security Deposit"
  amount: number | null;
  formattedAmount: string; // e.g., "$145,000 / year", "$18,500"
  currency?: string;
  category: "salary" | "fee" | "deposit" | "penalty" | "reimbursement" | "damages" | "other";
  conditions?: string;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  documentType:
    | "employment_agreement"
    | "independent_contractor"
    | "nda"
    | "lease_commercial"
    | "lease_residential"
    | "services_agreement"
    | "general_contract";
  jurisdiction?: string | null;
  governingLaw?: string | null;
  effectiveDate?: string | null;
  executionDate?: string | null;
  expirationDate?: string | null;
  pageCount?: number | null;
  wordCount?: number | null;
  uploadedAt: string;
  fileName?: string;
  fileSizeBytes?: number;
  parties: Party[];
  isUntrustedContent: boolean; // All user documents are isolated as untrusted data
}

export interface Clause {
  id: string;
  section: string; // e.g., "Section 6.3", "Paragraph 4"
  title: string;
  rawText: string; // Verbatim text as closely as possible
  plainEnglish: string; // Plain English translation without legal jargon
  category: ClauseCategory;
  pageNumber: number | null; // Explicitly null if location unavailable
  importance: ImportanceLevel;
  // Legacy aliases for backward compatibility
  sectionNumber?: string;
  plainEnglishSummary?: string;
  highlightedRisk?: SeverityLevel;
}

export interface EvidenceLink {
  findingId: string;
  documentId: string;
  clauseId: string;
  pageNumber: number | null; // Explicitly null if unavailable
  section: string;
  quotedText: string; // Exact verbatim or near-exact quote from the clause
}

export interface Finding {
  id: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  description: string;
  whyItMatters: string;
  clauseId: string;
  evidence: EvidenceLink;
  uncertainties: string[];
  // Legacy fields
  documentId?: string;
  summary?: string;
  detailedAnalysis?: string;
  clauseIds?: string[];
  associatedParties?: string[];
}

export interface LegalSource {
  id: string;
  title: string;
  citation: string;
  jurisdiction: string;
  authorityType: "statute" | "case_law" | "regulation" | "restatement" | "standard_practice";
  excerpt: string;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  notes?: string;
}

export interface Uncertainty {
  id: string;
  findingId: string;
  factualDependencies: string[];
  unverifiedAssumptions: string[];
  explanation: string;
  isFactVsInterpretationClear: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  partyResponsible: string;
  isReversible: boolean;
  recommendedTimeline: string;
  practicalAdvice: string;
}

export interface EvidenceChain {
  id: string;
  finding: Finding;
  documentEvidence: {
    clauseId: string;
    section: string;
    pageNumber?: number | null;
    exactQuote: string;
  };
  legalSource?: LegalSource;
  confidence: {
    level: ConfidenceLevel;
    rationale: string;
  };
  uncertainty: Uncertainty;
  practicalNextStep: ActionItem;
}

export interface LawyerBrief {
  id: string;
  generatedAt: string;
  documentSummary: string;
  partiesInvolved: string[];
  keyIssuesToReview: {
    issue: string;
    clauseReference: string;
    severity: SeverityLevel;
    recommendedQuestion: string;
  }[];
  missingInformation: string[];
  recommendedNegotiationPoints: string[];
}

export interface AnalysisReport {
  id: string;
  documentId: string;
  metadata: DocumentMetadata;
  createdAt: string;
  status: "completed" | "processing" | "needs_clarification" | "error";
  summary: {
    overallReadiness: "high_risk_clauses_present" | "review_recommended" | "standard_terms";
    keyTakeaway: string;
    totalClausesAnalyzed: number;
    criticalAttentionCount: number;
    highAttentionCount: number;
    reviewCount: number;
    contextDependentCount: number;
    informationalCount: number;
  };
  clauses: Clause[];
  findings: Finding[];
  evidenceLinks: EvidenceLink[];
  financialTerms: KeyFinancialTerm[];
  keyDates: KeyDate[];
  evidenceChains: EvidenceChain[];
  actionItems: ActionItem[];
  lawyerBrief: LawyerBrief;
  safetyDisclaimer: string;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: "application/pdf" | "text/plain" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  storagePath?: string;
  rawText?: string;
  uploadedAt: string;
  analysisId?: string;
  status: "uploaded" | "parsed" | "analyzed" | "error";
}

export interface SituationQuestion {
  id: string;
  question: string;
  whyItMatters: string;
  responseType: "text" | "choice" | "date" | "boolean";
  options?: string[];
  isAnswered?: boolean;
  answer?: string;
}

export interface SituationAssessment {
  id: string;
  userPrompt: string;
  identifiedCategory:
    | "employment_dispute"
    | "landlord_tenant"
    | "consumer_contract"
    | "freelance_unpaid_invoice"
    | "intellectual_property"
    | "business_partnership"
    | "other";
  jurisdictionEstimate?: string;
  followUpQuestions: SituationQuestion[];
  missingFacts: string[];
  relevantLegalConcepts: {
    concept: string;
    plainEnglishExplanation: string;
    caveat: string;
  }[];
  possibleOptions: {
    title: string;
    pros: string[];
    risks: string[];
    reversibility: "high" | "moderate" | "low";
  }[];
  evidenceToCollect: string[];
  questionsForLawyer: string[];
  actionChecklist: ActionItem[];
  createdAt: string;
}

export interface Situation {
  id: string;
  title: string;
  initialDescription: string;
  createdAt: string;
  assessment?: SituationAssessment;
  status: "draft" | "assessed" | "closed";
}
