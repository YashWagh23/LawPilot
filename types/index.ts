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

export type ConfidenceLevel = "high" | "moderate" | "limited" | "insufficient" | "low";

export type JurisdictionConfidence = "high" | "medium" | "low" | "unknown";
export type JurisdictionSource = "document" | "user" | "inferred";

export interface JurisdictionContext {
  country: string;
  stateOrUT?: string;
  governingLaw?: string;
  confidence: JurisdictionConfidence;
  source: JurisdictionSource;
  evidence?: string[];
  ambiguityWarnings?: string[];
}

export type VerificationStatus =
  | "verified"
  | "partially_verified"
  | "context_only"
  | "requires_human_counsel"
  | "unsupported"
  | "conflicting"
  | "insufficient_context"
  | "unverified";

export type SourceType =
  | "official_legislation"
  | "official_court"
  | "government_agency"
  | "regulator"
  | "recognized_legal_source"
  | "secondary_source"
  | "general_web"
  | "unverified";

export type SupportLevel =
  | "direct"
  | "strong"
  | "partial"
  | "context_dependent"
  | "unsupported";

export type VerificationStatusLevel =
  | "verified"
  | "partially_verified"
  | "unsupported"
  | "conflicting"
  | "insufficient_context";

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
  isDeadline?: boolean;
  clauseReference?: {
    section?: string;
    pageNumber?: number | null;
  };
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
  jurisdictionContext?: JurisdictionContext;
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
  clauseText?: string;
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
  // Extended & legacy fields for Action Plan and Brief linkages
  plainEnglishSummary?: string;
  actionableAdvice?: string;
  clauseReference?: {
    clauseId?: string;
    section?: string;
    pageNumber?: number | null;
    exactQuote?: string;
  };
  documentId?: string;
  summary?: string;
  detailedAnalysis?: string;
  clauseIds?: string[];
  associatedParties?: string[];
}

export interface LegalSource {
  id: string;
  title: string;
  publisher?: string;
  sourceType: SourceType;
  jurisdiction: string;
  jurisdictionContext?: JurisdictionContext;
  citation: string;
  url?: string;
  sourceUrl?: string; // backward compatibility
  relevance: string;
  retrievedAt: string;
  publicationDate?: string;
  verificationStatus: VerificationStatusLevel | VerificationStatus;
  excerpt?: string;
  relevantExcerpt?: string;
  notes?: string;
  authorityType?: "statute" | "case_law" | "regulation" | "restatement" | "standard_practice"; // backward compatibility
}

export interface LegalClaim {
  id: string;
  findingId: string;
  claim: string;
  statement?: string; // backward compatibility
  sourceIds: string[];
  supportLevel: SupportLevel;
  explanation: string;
  uncertainties: string[];
  jurisdiction: string;
  jurisdictionContext?: JurisdictionContext;
  verified: boolean;
}

export interface DocumentEvidence {
  clauseId: string;
  quotedText: string;
  pageNumber: number | null;
  section: string;
  sourceType: "document";
  exactQuote?: string; // backward compatibility
}

export interface LegalEvidence {
  legalSourceId: string;
  claimId: string;
  citation: string;
  relevantExcerpt: string;
  sourceType: "legal";
}

export interface VerificationDetails {
  status: VerificationStatusLevel;
  verifiedAt: string;
  issues: string[];
  confidenceLevel: ConfidenceLevel;
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
  jurisdictionContext?: JurisdictionContext;
  finding: Finding;
  documentEvidence: DocumentEvidence;
  legalClaims: LegalClaim[];
  legalSources: LegalSource[];
  legalEvidence?: LegalEvidence[];
  verification: VerificationDetails;
  uncertainties: string[];
  nextSteps: ActionItem[];
  // Backward compatibility / convenience aliases
  confidence?: {
    level: ConfidenceLevel;
    rationale: string;
  };
  uncertainty?: Uncertainty;
  practicalNextStep?: ActionItem;
  legalSource?: LegalSource;
}

export interface ClauseQuestionInput {
  documentId: string;
  clauseId: string;
  question: string;
  jurisdiction?: string;
}

export interface ClauseQuestionAnswer {
  question: string;
  clauseId: string;
  whatContractSays: string;
  legalContext: string;
  whatThisMeans: string;
  whatWeCannotDetermine: string;
  nextStep: string;
  sources: LegalSource[];
  confidence: ConfidenceLevel;
}

export type ActionItemType =
  | "clarify"
  | "collect_document"
  | "confirm_fact"
  | "ask_party"
  | "compare_version"
  | "seek_professional_review"
  | "monitor_deadline"
  | "preserve_evidence"
  | "general_preparation";

export type ActionPriority = "urgent" | "important" | "recommended" | "optional";

export interface ActionPlanItem {
  id: string;
  title: string;
  explanation: string;
  actionType: ActionItemType;
  priority: ActionPriority;
  findingId?: string;
  findingTitle?: string;
  clauseId?: string;
  clauseSection?: string;
  pageNumber?: number | null;
  isReversible: boolean;
  completed?: boolean;
  completedAt?: string;
  practicalAdvice?: string;
}

export interface ActionPlanTrigger {
  id: string;
  findingId: string;
  clauseSection: string;
  reason: string;
  severity: SeverityLevel;
}

export interface ActionPlan {
  id: string;
  documentId: string;
  summary: string;
  urgentItems: ActionPlanItem[];
  beforeSigning: ActionPlanItem[];
  questionsToAsk: ActionPlanItem[];
  documentsToCollect: ActionPlanItem[];
  factsToConfirm: ActionPlanItem[];
  professionalReviewTriggers: ActionPlanTrigger[];
  followUpItems: ActionPlanItem[];
  items?: ActionPlanItem[];
  generatedAt: string;
}

export interface ActionItemProgress {
  actionId: string;
  completed: boolean;
  completedAt?: string;
}

export interface LawyerBriefClause {
  clauseId: string;
  section: string;
  pageNumber: number | null;
  excerpt: string;
  plainEnglish: string;
  importance: SeverityLevel;
}

export interface LawyerBriefLegalContext {
  issueTitle: string;
  sourceTitle: string;
  citation: string;
  jurisdiction: string;
  explanation: string;
  verificationStatus: string;
}

export interface LawyerBriefQuestion {
  findingId: string;
  clauseReference: string;
  question: string;
  context: string;
}

export interface LawyerBriefDate {
  label: string;
  date?: string | null;
  noticePeriodDays?: number | null;
  description: string;
  isDeadline: boolean;
}

export interface DetailedLawyerBrief {
  id: string;
  generatedAt: string;
  matterSummary: string;
  document: {
    title: string;
    documentType: string;
    date: string;
    parties: string[];
    jurisdiction?: string;
    jurisdictionContext?: JurisdictionContext;
  };
  jurisdictionContext?: JurisdictionContext;
  userConcerns: string[];
  relevantClauses: LawyerBriefClause[];
  verifiedLegalContext: LawyerBriefLegalContext[];
  whatRemainsUncertain: string[];
  documentsAvailable: string[];
  questionsForCounsel: LawyerBriefQuestion[];
  importantDates: LawyerBriefDate[];
  disclaimer: string;
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
  // `jurisdiction` and `jurisdictionContext` are intentionally kept in sync (same value) by the
  // orchestrator: `jurisdiction` is the original field name, `jurisdictionContext` is what most
  // downstream consumers (askEngine, contextBuilder, AnalysisClientView) read. Always set both.
  jurisdiction?: JurisdictionContext;
  jurisdictionContext?: JurisdictionContext;
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
  actionPlan?: ActionPlan;
  lawyerBrief: LawyerBrief;
  detailedLawyerBrief?: DetailedLawyerBrief;
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
  situationSummary?: string;
  identifiedCategory:
    | "employment_dispute"
    | "landlord_tenant"
    | "consumer_contract"
    | "freelance_unpaid_invoice"
    | "intellectual_property"
    | "business_partnership"
    | "insufficient_information"
    | "other";
  jurisdictionEstimate?: string;
  disclaimer?: string;
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

export * from "./ask";
export * from "./compare";

export * from "./negotiation";
