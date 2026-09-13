import type {
  ActionPlanItem,
  Clause,
  ClauseCategory,
  DocumentMetadata,
  EvidenceChain,
  JurisdictionContext,
} from "./index";

/**
 * Controlled change types for comparison
 */
export type ChangeType = "ADDED" | "REMOVED" | "MODIFIED" | "MOVED" | "UNCHANGED";

/**
 * Controlled significance levels
 * No arbitrary numerical risk scores.
 */
export type ChangeSignificance = "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";

/**
 * Impact categories for legal changes
 */
export type ImpactCategory = "financial" | "operational" | "legal" | "timing" | "scope";

/**
 * Granular semantic parameter diff detail
 */
export interface SemanticDiffDetail {
  parameter: string; // e.g. "Notice Period", "Training Reimbursement", "Non-Compete Scope"
  previousValue: string; // e.g. "60 days", "₹2,00,000", "State of Maharashtra"
  currentValue: string; // e.g. "90 days", "₹4,50,000", "Territory of India"
  changeSummary: string; // e.g. "+30 days", "+₹2,50,000 (+125%)", "Expanded nationwide"
  impactCategory: ImpactCategory;
}

/**
 * Single Clause Comparison Item
 * Captures WHAT CHANGED, WHERE IT CHANGED, WHY IT MAY MATTER, LEGAL CONTEXT, WHAT TO VERIFY, WHAT TO ASK
 */
export interface ClauseComparisonItem {
  id: string;
  clauseTitle: string;
  category: ClauseCategory;
  previousClause: Clause | null;
  currentClause: Clause | null;
  previousSection: string | null;
  currentSection: string | null;
  changeType: ChangeType;
  significance: ChangeSignificance;
  significanceExplanation: string;
  summary: string;
  whatChanged: {
    original: string;
    revised: string;
  };
  whyItMatters: string;
  whatToVerify: string[];
  whatToAsk: string;
  impacts: {
    category: ImpactCategory;
    label: string; // e.g., "Financial", "Timing", "Legal"
    description: string;
  }[];
  evidenceChain?: EvidenceChain | null;
  legalContextSnippet?: {
    findingId?: string;
    legalQuestion?: string;
    legalClaim?: string;
    citation?: string;
    sourceTitle?: string;
    jurisdiction?: string;
    uncertainty?: string;
    practicalNextStep?: string;
  };
  suggestedActionItem: ActionPlanItem;
  suggestedAskQuestion: string;
  semanticDetails?: SemanticDiffDetail[];
}

/**
 * Comparison Summary statistics
 */
export interface ComparisonSummary {
  totalPreviousClauses: number;
  totalCurrentClauses: number;
  clausesChanged: number;
  clausesAdded: number;
  clausesRemoved: number;
  clausesMoved: number;
  clausesUnchanged: number;
  materialChangesCount: number; // High + Medium
  highSignificanceCount: number;
  mediumSignificanceCount: number;
  lowSignificanceCount: number;
  informationalCount: number;
}

/**
 * Jurisdiction Comparison Status
 */
export interface JurisdictionComparison {
  previousJurisdiction: JurisdictionContext;
  currentJurisdiction: JurisdictionContext;
  isAligned: boolean;
  statusLabel: string; // e.g., "India · Maharashtra · Aligned" or "JURISDICTION CHANGED"
  warning?: string;
}

/**
 * Document version descriptor
 */
export interface ComparisonDocumentInfo {
  id: string;
  title: string;
  fileName: string;
  fileSizeBytes?: number;
  pageCount?: number;
  wordCount?: number;
  metadata?: DocumentMetadata;
}

/**
 * Full Document Comparison Result
 */
export interface DocumentComparisonResult {
  id: string;
  previousDocument: ComparisonDocumentInfo;
  currentDocument: ComparisonDocumentInfo;
  jurisdictionComparison: JurisdictionComparison;
  summary: ComparisonSummary;
  changes: ClauseComparisonItem[];
  topMaterialChanges: ClauseComparisonItem[];
  analyzedAt: string;
  disclaimer: string;
}
