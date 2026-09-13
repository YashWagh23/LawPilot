import type {
  ActionItem,
  ActionPlan,
  AnalysisReport,
  DetailedLawyerBrief,
  EvidenceChain,
} from "@/types";
import { validateDocumentFile } from "@/lib/documents/fileValidator";
import { extractDocumentContent } from "@/lib/documents/textExtractor";
import { normalizeDocumentContent } from "@/lib/documents/documentNormalizer";
import { segmentDocumentIntoClauses } from "@/lib/documents/clauseSegmenter";
import { extractDocumentFacts } from "@/lib/ai/agents/extractionAgent";
import { identifyImportantClausesAndFindings } from "@/lib/ai/agents/riskAnalysisAgent";
import { mapFindingsToEvidence } from "./evidenceMapper";
import {
  detectJurisdiction,
  isIndianJurisdiction,
} from "@/lib/jurisdiction/jurisdictionDetector";
import {
  DEMO_VERIFIED_INDIAN_LEGAL_SOURCES,
  DEMO_VERIFIED_LEGAL_SOURCES,
} from "@/lib/ai/agents/legalResearchAgent";
import { verifyAndAssembleEvidence } from "@/lib/ai/agents/verificationAgent";
import { generateActionPlan } from "@/lib/ai/agents/actionPlanningAgent";
import { generateDetailedLawyerBrief } from "@/lib/ai/agents/lawyerBriefAgent";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";

export interface PipelineProgressUpdate {
  stage:
    | "VALIDATE"
    | "READ_DOCUMENT"
    | "EXTRACT_CLAUSES"
    | "IDENTIFY_TERMS"
    | "CHECK_LEGAL_CONTEXT"
    | "BUILD_EVIDENCE_CHAINS"
    | "PREPARE_ACTION_PLAN"
    | "COMPLETE"
    | "FAILED";
  label: string;
  stepIndex: number;
  totalSteps: number;
  timestamp: string;
  error?: string;
}

// In-memory runtime cache of analyzed reports (frictionless local-first retrieval)
const reportCache = new Map<string, AnalysisReport>();

export function getCachedAnalysisReport(id: string): AnalysisReport | null {
  return reportCache.get(id) || null;
}

export function saveCachedAnalysisReport(report: AnalysisReport): void {
  reportCache.set(report.id, report);
}

/**
 * Main Document Intelligence Analysis Orchestrator
 * Executes the complete 6-stage end-to-end processing pipeline from raw file buffer
 * to fully-hydrated AnalysisReport with Jurisdiction, Evidence Chains, Action Plan, and Lawyer Brief.
 */
export async function orchestrateDocumentAnalysis(
  fileBuffer: Buffer,
  fileName: string,
  onProgress?: (update: PipelineProgressUpdate) => void
): Promise<AnalysisReport> {
  const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Stage 0: Security & Format Validation
  onProgress?.({
    stage: "VALIDATE",
    label: "Validating file integrity, MIME signatures, and size limits...",
    stepIndex: 0,
    totalSteps: 6,
    timestamp: new Date().toISOString(),
  });

  const validation = validateDocumentFile(fileBuffer, fileName);
  if (!validation.isValid) {
    onProgress?.({
      stage: "FAILED",
      label: validation.errorMessage,
      stepIndex: 0,
      totalSteps: 6,
      timestamp: new Date().toISOString(),
      error: validation.errorMessage,
    });
    throw new Error(validation.errorMessage);
  }

  // Stage 1: Reading document
  onProgress?.({
    stage: "READ_DOCUMENT",
    label: "Reading document text and establishing untrusted memory boundary...",
    stepIndex: 1,
    totalSteps: 6,
    timestamp: new Date().toISOString(),
  });

  const extractedContent = await extractDocumentContent(
    fileBuffer,
    validation.fileType
  );

  if (!extractedContent.rawText || extractedContent.rawText.trim().length < 20) {
    const emptyErr = "We couldn't extract enough text to analyze this document.";
    onProgress?.({
      stage: "FAILED",
      label: emptyErr,
      stepIndex: 1,
      totalSteps: 6,
      timestamp: new Date().toISOString(),
      error: emptyErr,
    });
    throw new Error(emptyErr);
  }

  const normalized = normalizeDocumentContent(
    extractedContent.rawText,
    extractedContent.pages
  );

  // Stage 2: Extracting clauses
  onProgress?.({
    stage: "EXTRACT_CLAUSES",
    label: "Extracting clauses, section boundaries, and hierarchy...",
    stepIndex: 2,
    totalSteps: 6,
    timestamp: new Date().toISOString(),
  });

  let segmentedClauses = segmentDocumentIntoClauses(
    normalized.normalizedFullText,
    normalized.normalizedPages,
    documentId
  );

  // Stage 3: Identifying important terms
  onProgress?.({
    stage: "IDENTIFY_TERMS",
    label: "Identifying important terms, defined obligations, and one-sided clauses...",
    stepIndex: 3,
    totalSteps: 6,
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

  if (factExtraction.clauses.length > 0) {
    segmentedClauses = factExtraction.clauses;
  }

  const riskResult = identifyImportantClausesAndFindings({
    documentId,
    clauses: segmentedClauses,
  });

  const { mappedFindings, evidenceLinks } = mapFindingsToEvidence(
    riskResult.findings,
    segmentedClauses,
    documentId
  );

  // Stage 4: Checking legal context (Jurisdiction & Statutory Grounding)
  onProgress?.({
    stage: "CHECK_LEGAL_CONTEXT",
    label: "Detecting jurisdiction context and retrieving verified statutory authorities...",
    stepIndex: 4,
    totalSteps: 6,
    timestamp: new Date().toISOString(),
  });

  const detectedJurisdiction = detectJurisdiction({
    text: normalized.normalizedFullText,
    clauses: segmentedClauses,
    metadata: factExtraction.metadata,
  });

  // Select verified statutory repository calibrated to detected jurisdiction
  const legalSourcesMap = isIndianJurisdiction(detectedJurisdiction)
    ? DEMO_VERIFIED_INDIAN_LEGAL_SOURCES
    : DEMO_VERIFIED_LEGAL_SOURCES;
  const legalSources = Object.values(legalSourcesMap).flat();

  // Stage 5: Building evidence chains
  onProgress?.({
    stage: "BUILD_EVIDENCE_CHAINS",
    label: "Building verified evidence chains connecting clauses to legal context...",
    stepIndex: 5,
    totalSteps: 6,
    timestamp: new Date().toISOString(),
  });

  let evidenceChains: EvidenceChain[] = [];
  try {
    const verificationResult = await verifyAndAssembleEvidence({
      findings: mappedFindings,
      clauses: segmentedClauses,
      sources: legalSources,
      jurisdiction: `${detectedJurisdiction.country}${
        detectedJurisdiction.stateOrUT ? " · " + detectedJurisdiction.stateOrUT : ""
      }`,
      governingLaw: detectedJurisdiction.governingLaw,
    });
    evidenceChains = verificationResult.evidenceChains;
  } catch {
    // Non-fatal: fallback to empty chains if assembly encountered issues
    evidenceChains = [];
  }

  // Stage 6: Preparing action plan & lawyer brief
  onProgress?.({
    stage: "PREPARE_ACTION_PLAN",
    label: "Preparing actionable preparation checklist and lawyer-ready brief...",
    stepIndex: 6,
    totalSteps: 6,
    timestamp: new Date().toISOString(),
  });

  let actionPlan: ActionPlan | undefined = undefined;
  try {
    actionPlan = await generateActionPlan({
      documentId,
      documentTitle: factExtraction.metadata?.title || validation.sanitizedFileName,
      documentSummary: factExtraction.metadata?.title
        ? `Legal agreement analyzed by LawPilot: ${factExtraction.metadata.title}`
        : "Legal agreement analyzed by LawPilot.",
      parties: factExtraction.parties.map((p) => `${p.name} (${p.role})`),
      jurisdiction: detectedJurisdiction.country,
      findings: mappedFindings,
      evidenceChains,
      keyDates: factExtraction.dates,
    });
  } catch {
    actionPlan = undefined;
  }

  if (actionPlan) {
    actionPlan.items = [
      ...actionPlan.urgentItems,
      ...actionPlan.beforeSigning,
      ...actionPlan.questionsToAsk,
      ...actionPlan.documentsToCollect,
      ...actionPlan.factsToConfirm,
      ...actionPlan.followUpItems,
    ];
  }

  let detailedLawyerBrief: DetailedLawyerBrief | undefined = undefined;
  try {
    detailedLawyerBrief = await generateDetailedLawyerBrief({
      documentId,
      documentTitle: factExtraction.metadata?.title || validation.sanitizedFileName,
      documentType: factExtraction.metadata?.documentType || "Agreement",
      date: factExtraction.metadata?.effectiveDate || undefined,
      parties: factExtraction.parties.map((p) => `${p.name} (${p.role})`),
      jurisdiction: `${detectedJurisdiction.country}${
        detectedJurisdiction.stateOrUT ? " · " + detectedJurisdiction.stateOrUT : ""
      }`,
      jurisdictionContext: detectedJurisdiction,
      documentSummary: factExtraction.metadata?.title
        ? `Legal agreement analyzed by LawPilot: ${factExtraction.metadata.title}`
        : "Legal agreement analyzed by LawPilot.",
      findings: mappedFindings,
      clauses: segmentedClauses,
      evidenceChains,
      keyDates: factExtraction.dates,
      actionPlan,
    });
  } catch {
    detailedLawyerBrief = undefined;
  }

  // Backward-compatible action items
  const backwardCompatibleActionItems: ActionItem[] = actionPlan?.items && actionPlan.items.length > 0
    ? actionPlan.items.map((item, idx) => ({
        id: item.id || `act-${idx + 1}`,
        title: item.title,
        description: item.explanation,
        priority:
          item.priority === "urgent"
            ? "high"
            : item.priority === "important"
            ? "high"
            : "medium",
        partyResponsible: "Document Reviewer",
        isReversible: item.isReversible,
        recommendedTimeline: item.actionType === "monitor_deadline" ? "Milestone" : "Before signing",
        practicalAdvice: item.practicalAdvice || "Review clause with legal counsel.",
      }))
    : mappedFindings.map((f, idx) => ({
        id: `act-${idx + 1}`,
        title: `Clarify ${f.title}`,
        description: f.description,
        priority:
          f.severity === "critical_attention" || f.severity === "high_attention"
            ? "high"
            : "medium",
        partyResponsible: "Document Reviewer",
        isReversible: true,
        recommendedTimeline: "Before signing",
        practicalAdvice: `Review ${f.evidence.section} with legal counsel or request written clarification from counterparty.`,
      }));

  // Build the complete, fully-hydrated AnalysisReport
  const report: AnalysisReport = {
    id: documentId,
    documentId,
    jurisdiction: detectedJurisdiction,
    metadata: {
      ...factExtraction.metadata,
      pageCount: extractedContent.totalPageCount,
      wordCount: extractedContent.wordCount,
      fileName: validation.sanitizedFileName,
      fileSizeBytes: validation.sizeBytes,
      isUntrustedContent: true,
      governingLaw: detectedJurisdiction.governingLaw,
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
    evidenceChains,
    actionPlan,
    actionItems: backwardCompatibleActionItems,
    detailedLawyerBrief,
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
      recommendedNegotiationPoints: mappedFindings.map(
        (f) => `Request clarification on ${f.evidence.section}`
      ),
    },
    safetyDisclaimer: GLOBAL_LEGAL_DISCLAIMER,
  };

  // Cache in memory for instant frictionless retrieval
  saveCachedAnalysisReport(report);

  onProgress?.({
    stage: "COMPLETE",
    label: "Analysis complete.",
    stepIndex: 6,
    totalSteps: 6,
    timestamp: new Date().toISOString(),
  });

  return report;
}
