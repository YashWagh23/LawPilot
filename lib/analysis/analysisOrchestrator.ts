import type { AnalysisReport } from "@/types";
import { validateDocumentFile } from "@/lib/documents/fileValidator";
import { extractDocumentContent } from "@/lib/documents/textExtractor";
import { normalizeDocumentContent } from "@/lib/documents/documentNormalizer";
import { segmentDocumentIntoClauses } from "@/lib/documents/clauseSegmenter";
import { extractDocumentFacts } from "@/lib/ai/agents/extractionAgent";
import { identifyImportantClausesAndFindings } from "@/lib/ai/agents/riskAnalysisAgent";
import { mapFindingsToEvidence } from "./evidenceMapper";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";

export interface PipelineProgressUpdate {
  stage:
    | "VALIDATE"
    | "EXTRACT_CONTENT"
    | "NORMALIZE_CONTENT"
    | "SEGMENT_CLAUSES"
    | "EXTRACT_FACTS"
    | "IDENTIFY_FINDINGS"
    | "MAP_EVIDENCE"
    | "COMPLETE"
    | "FAILED";
  label: string;
  progressPercent: number;
  timestamp: string;
  error?: string;
}

// In-memory runtime cache of analyzed reports
const reportCache = new Map<string, AnalysisReport>();

export function getCachedAnalysisReport(id: string): AnalysisReport | null {
  return reportCache.get(id) || null;
}

export function saveCachedAnalysisReport(report: AnalysisReport): void {
  reportCache.set(report.id, report);
}

/**
 * Main Document Intelligence Analysis Orchestrator
 * Runs the end-to-end processing pipeline from binary upload to structured AnalysisReport.
 */
export async function orchestrateDocumentAnalysis(
  fileBuffer: Buffer,
  fileName: string,
  onProgress?: (update: PipelineProgressUpdate) => void
): Promise<AnalysisReport> {
  const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Stage 1: Validate File
  onProgress?.({
    stage: "VALIDATE",
    label: "Validating document format and security signatures...",
    progressPercent: 10,
    timestamp: new Date().toISOString(),
  });

  const validation = validateDocumentFile(fileBuffer, fileName);
  if (!validation.isValid) {
    onProgress?.({
      stage: "FAILED",
      label: validation.errorMessage,
      progressPercent: 10,
      timestamp: new Date().toISOString(),
      error: validation.errorMessage,
    });
    throw new Error(validation.errorMessage);
  }

  // Stage 2: Extract Content
  onProgress?.({
    stage: "EXTRACT_CONTENT",
    label: "Reading text and isolating document pages...",
    progressPercent: 25,
    timestamp: new Date().toISOString(),
  });

  const extractedContent = await extractDocumentContent(
    fileBuffer,
    validation.fileType
  );

  // Stage 3: Normalize Content
  onProgress?.({
    stage: "NORMALIZE_CONTENT",
    label: "Normalizing text and establishing untrusted memory boundary...",
    progressPercent: 40,
    timestamp: new Date().toISOString(),
  });

  const normalized = normalizeDocumentContent(
    extractedContent.rawText,
    extractedContent.pages
  );

  // Stage 4: Segment into Clauses/Sections
  onProgress?.({
    stage: "SEGMENT_CLAUSES",
    label: "Identifying clause boundaries and section numbering...",
    progressPercent: 55,
    timestamp: new Date().toISOString(),
  });

  let segmentedClauses = segmentDocumentIntoClauses(
    normalized.normalizedFullText,
    normalized.normalizedPages,
    documentId
  );

  // Stage 5: Extract Structured Facts (Gemini Extraction Agent)
  onProgress?.({
    stage: "EXTRACT_FACTS",
    label: "Extracting parties, key dates, financial metrics, and plain English summaries...",
    progressPercent: 70,
    timestamp: new Date().toISOString(),
  });

  const factExtraction = await extractDocumentFacts({
    documentId,
    fileName: validation.sanitizedFileName,
    normalizedText: normalized.normalizedFullText,
    isolatedContent: normalized.isolatedContent,
    pages: normalized.normalizedPages,
    fileSizeBytes: validation.sizeBytes,
  });

  // If Gemini produced enriched clauses, merge them with segmenter
  if (factExtraction.clauses.length > 0) {
    segmentedClauses = factExtraction.clauses;
  }

  // Stage 6: Identify Important Clauses & Create Initial Findings
  onProgress?.({
    stage: "IDENTIFY_FINDINGS",
    label: "Identifying important provisions requiring attention...",
    progressPercent: 85,
    timestamp: new Date().toISOString(),
  });

  const riskResult = identifyImportantClausesAndFindings({
    documentId,
    clauses: segmentedClauses,
  });

  // Stage 7: Evidence Mapping
  onProgress?.({
    stage: "MAP_EVIDENCE",
    label: "Linking every finding to verbatim clause evidence...",
    progressPercent: 95,
    timestamp: new Date().toISOString(),
  });

  const { mappedFindings, evidenceLinks } = mapFindingsToEvidence(
    riskResult.findings,
    segmentedClauses,
    documentId
  );

  // Build the complete AnalysisReport
  const report: AnalysisReport = {
    id: documentId,
    documentId,
    metadata: {
      ...factExtraction.metadata,
      pageCount: extractedContent.totalPageCount,
      wordCount: extractedContent.wordCount,
      fileName: validation.sanitizedFileName,
      fileSizeBytes: validation.sizeBytes,
      isUntrustedContent: true,
    },
    createdAt: new Date().toISOString(),
    status: "completed",
    summary: {
      overallReadiness:
        riskResult.criticalAttentionCount > 0 || riskResult.highAttentionCount > 0
          ? "high_risk_clauses_present"
          : riskResult.reviewCount > 0
          ? "review_recommended"
          : "standard_terms",
      keyTakeaway:
        riskResult.criticalAttentionCount > 0
          ? `Identified ${riskResult.criticalAttentionCount} critical attention clause(s) and ${riskResult.highAttentionCount} item(s) deserving review prior to execution.`
          : riskResult.highAttentionCount > 0
          ? `Identified ${riskResult.highAttentionCount} clause(s) that deserve close attention prior to execution.`
          : "Extracted standard contractual obligations with customary provisions.",
      totalClausesAnalyzed: segmentedClauses.length,
      criticalAttentionCount: riskResult.criticalAttentionCount,
      highAttentionCount: riskResult.highAttentionCount,
      reviewCount: riskResult.reviewCount,
      contextDependentCount: riskResult.contextDependentCount,
      informationalCount: riskResult.informationalCount,
    },
    clauses: segmentedClauses,
    findings: mappedFindings,
    evidenceLinks,
    financialTerms: factExtraction.financialTerms,
    keyDates: factExtraction.dates,
    evidenceChains: [],
    actionItems: mappedFindings.map((f, idx) => ({
      id: `act-${idx + 1}`,
      title: `Clarify ${f.title}`,
      description: f.description,
      priority: f.severity === "critical_attention" || f.severity === "high_attention" ? "high" : "medium",
      partyResponsible: "Document Reviewer",
      isReversible: true,
      recommendedTimeline: "Before signing",
      practicalAdvice: `Review ${f.evidence.section} with legal counsel or request written clarification from counterparty.`,
    })),
    lawyerBrief: {
      id: `brief-${documentId}`,
      generatedAt: new Date().toISOString(),
      documentSummary: `${factExtraction.metadata.title} containing ${segmentedClauses.length} clauses analyzed for obligations and risk allocation.`,
      partiesInvolved: factExtraction.parties.map((p) => `${p.name} (${p.role})`),
      keyIssuesToReview: mappedFindings.map((f) => ({
        issue: f.title,
        clauseReference: f.evidence.section,
        severity: f.severity,
        recommendedQuestion: `What is the counterparty's standard position on modifying ${f.evidence.section}?`,
      })),
      missingInformation: factExtraction.uncertainties,
      recommendedNegotiationPoints: mappedFindings.map((f) => `Request clarification on ${f.evidence.section}`),
    },
    safetyDisclaimer: GLOBAL_LEGAL_DISCLAIMER,
  };

  // Cache in memory for instant retrieval
  saveCachedAnalysisReport(report);

  onProgress?.({
    stage: "COMPLETE",
    label: "Analysis complete.",
    progressPercent: 100,
    timestamp: new Date().toISOString(),
  });

  return report;
}
