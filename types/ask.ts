import type { ConfidenceLevel, LegalSource, VerificationStatus } from "./index";

/**
 * Question Classification Categories for Ask LawPilot
 */
export type AskQuestionType =
  | "DOCUMENT_FACT"
  | "CLAUSE_EXPLANATION"
  | "LEGAL_CONTEXT"
  | "RISK_INTERPRETATION"
  | "ACTION_NEXT_STEP"
  | "MISSING_INFORMATION"
  | "OUT_OF_SCOPE";

/**
 * Citation reference to an exact clause or statutory authority
 */
export interface AskAnswerCitation {
  id: string;
  type: "document_clause" | "legal_source";
  clauseId?: string;
  clauseTitle?: string;
  sectionNumber?: string;
  pageNumber?: number | null;
  exactQuote?: string;
  sourceId?: string;
  sourceTitle?: string;
  citation?: string;
  url?: string;
  jurisdiction?: string;
  authorityType?: "statute" | "case_law" | "regulation" | "guideline" | "other";
  verificationStatus?: VerificationStatus;
}

/**
 * Structured Answer Schema for Ask LawPilot
 * Strictly enforces evidence-first, calibrated legal intelligence
 */
export interface AskAnswerStructure {
  id: string;
  question: string;
  classification: AskQuestionType;
  answer: string; // Plain-English answer
  whatDocumentSays?: string; // Exact clause/document evidence where relevant
  legalContext?: string; // Verified legal information from the existing Evidence Chain
  whatIsUncertain?: string; // Facts or legal questions that cannot be determined
  whatToDoNext?: string; // Safe, practical, and reversible preparation step
  whatWouldChangeAnswer?: string[]; // Contingent facts that would alter legal enforceability
  followUpQuestions?: string[]; // Max 3 high-value follow-up questions when information is missing
  sources: LegalSource[]; // Verified legal sources
  citations: AskAnswerCitation[]; // Document and authority citations
  confidence: ConfidenceLevel;
  isOutOfScope: boolean;
  isLiveAi: boolean;
  disclaimer: string;
}

/**
 * Conversation Message
 */
export interface AskConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredAnswer?: AskAnswerStructure;
  timestamp: string;
}

/**
 * Local-First Conversation Persistence Container
 * Stored in localStorage under lawpilot_ask_[documentId]
 */
export interface AskConversationSession {
  documentId: string;
  messages: AskConversationMessage[];
  updatedAt: string;
}
