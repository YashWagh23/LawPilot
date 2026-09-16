import crypto from "crypto";
import type {
  ComparisonDocumentInfo,
  DocumentComparisonResult,
  JurisdictionComparison,
} from "@/types";
import { validateDocumentFile, DocumentInputError } from "@/lib/documents/fileValidator";
import { extractDocumentContent } from "@/lib/documents/textExtractor";
import { normalizeDocumentContent } from "@/lib/documents/documentNormalizer";
import { segmentDocumentIntoClauses } from "@/lib/documents/clauseSegmenter";
import { detectJurisdiction, isIndianJurisdiction } from "@/lib/jurisdiction/jurisdictionDetector";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";
import { matchClausesSemantically } from "./clauseMatcher";
import { analyzeAllClauseDifferences } from "./semanticChangeDetector";
import { compareJurisdictions, integrateLegalContext } from "./legalContextIntegrator";

export interface CompareOptions {
  previousBuffer: Buffer;
  previousFileName: string;
  currentBuffer: Buffer;
  currentFileName: string;
}

/**
 * Computes SHA-256 hash of a buffer
 */
function hashBuffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * End-to-end comparison pipeline between two documents.
 * Reuses existing Phase 2 extraction, normalization, and segmentation infrastructure.
 */
export async function compareDocumentBuffers(
  options: CompareOptions
): Promise<DocumentComparisonResult> {
  const { previousBuffer, previousFileName, currentBuffer, currentFileName } = options;

  // 1. Same-file check (Buffer hash)
  const prevHash = hashBuffer(previousBuffer);
  const currHash = hashBuffer(currentBuffer);

  if (prevHash === currHash) {
    throw new DocumentInputError(
      "Identical document selected for both Previous and Current versions. Please upload two distinct drafts or revisions to run a semantic legal comparison."
    );
  }

  // 2. Validate both documents using Phase 2 file validator
  const prevVal = validateDocumentFile(previousBuffer, previousFileName);
  if (!prevVal.isValid) {
    throw new DocumentInputError(`Previous Version validation failed: ${prevVal.errorMessage}`);
  }

  const currVal = validateDocumentFile(currentBuffer, currentFileName);
  if (!currVal.isValid) {
    throw new DocumentInputError(`Current Version validation failed: ${currVal.errorMessage}`);
  }

  // 3. Extract text from both documents concurrently
  const [prevExtracted, currExtracted] = await Promise.all([
    extractDocumentContent(previousBuffer, prevVal.fileType),
    extractDocumentContent(currentBuffer, currVal.fileType),
  ]);

  if (!prevExtracted.rawText || prevExtracted.rawText.trim().length === 0) {
    throw new DocumentInputError("Previous Version is empty or contains no extractable text.");
  }
  if (!currExtracted.rawText || currExtracted.rawText.trim().length === 0) {
    throw new DocumentInputError("Current Version is empty or contains no extractable text.");
  }

  // Check normalized text equality
  if (prevExtracted.rawText.trim() === currExtracted.rawText.trim()) {
    throw new DocumentInputError(
      "The text content of both files is completely identical. Please upload two distinct document revisions to compare."
    );
  }

  // 4. Normalize documents (sanitizes control characters and checks prompt injection boundaries)
  const prevNorm = normalizeDocumentContent(prevExtracted.rawText, prevExtracted.pages);
  const currNorm = normalizeDocumentContent(currExtracted.rawText, currExtracted.pages);

  // 5. Segment into clauses
  const previousClauses = segmentDocumentIntoClauses(
    prevNorm.normalizedFullText,
    prevNorm.normalizedPages,
    "prev-doc"
  );
  const currentClauses = segmentDocumentIntoClauses(
    currNorm.normalizedFullText,
    currNorm.normalizedPages,
    "curr-doc"
  );

  if (previousClauses.length === 0) {
    throw new DocumentInputError("Failed to identify any distinct clauses in Previous Version.");
  }
  if (currentClauses.length === 0) {
    throw new DocumentInputError("Failed to identify any distinct clauses in Current Version.");
  }

  // 6. Detect jurisdictions
  const prevJurisdiction = detectJurisdiction({
    text: prevNorm.normalizedFullText,
    clauses: previousClauses,
  });
  const currJurisdiction = detectJurisdiction({
    text: currNorm.normalizedFullText,
    clauses: currentClauses,
  });

  const jurisdictionComparison: JurisdictionComparison = compareJurisdictions(
    prevJurisdiction,
    currJurisdiction
  );

  // 7. Match clauses semantically
  const matchedPairs = matchClausesSemantically(previousClauses, currentClauses);

  // 8. Analyze semantic differences. The India-specific statutory narrative (Indian Contract Act,
  // Copyright Act, Arbitration and Conciliation Act) is only surfaced when the current document is
  // actually detected as Indian-governed; other jurisdictions get jurisdiction-neutral explanations
  // instead of an inapplicable Indian legal conclusion.
  const rawChanges = analyzeAllClauseDifferences(
    matchedPairs,
    isIndianJurisdiction(currJurisdiction)
  );

  // 9. Integrate legal context & Evidence Chains
  const changes = integrateLegalContext(rawChanges, jurisdictionComparison);

  // 10. Compute summary metrics
  let clausesChanged = 0;
  let clausesAdded = 0;
  let clausesRemoved = 0;
  let clausesMoved = 0;
  let clausesUnchanged = 0;
  let highSignificanceCount = 0;
  let mediumSignificanceCount = 0;
  let lowSignificanceCount = 0;
  let informationalCount = 0;

  for (const c of changes) {
    if (c.changeType === "ADDED") clausesAdded++;
    else if (c.changeType === "REMOVED") clausesRemoved++;
    else if (c.changeType === "MOVED") clausesMoved++;
    else if (c.changeType === "UNCHANGED") clausesUnchanged++;
    else if (c.changeType === "MODIFIED") clausesChanged++;

    if (c.significance === "HIGH") highSignificanceCount++;
    else if (c.significance === "MEDIUM") mediumSignificanceCount++;
    else if (c.significance === "LOW") lowSignificanceCount++;
    else if (c.significance === "INFORMATIONAL") informationalCount++;
  }

  const materialChangesCount = highSignificanceCount + mediumSignificanceCount;

  // Filter top 3-5 material changes (HIGH first, then MEDIUM)
  const topMaterialChanges = changes
    .filter((c) => c.significance === "HIGH" || c.significance === "MEDIUM")
    .sort((a, b) => {
      const weight = { HIGH: 3, MEDIUM: 2, LOW: 1, INFORMATIONAL: 0 };
      return weight[b.significance] - weight[a.significance];
    })
    .slice(0, 5);

  const previousDocument: ComparisonDocumentInfo = {
    id: `prev-${Date.now()}`,
    title: prevVal.sanitizedFileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
    fileName: prevVal.sanitizedFileName,
    fileSizeBytes: prevVal.sizeBytes,
    pageCount: prevExtracted.totalPageCount,
    wordCount: prevExtracted.wordCount,
  };

  const currentDocument: ComparisonDocumentInfo = {
    id: `curr-${Date.now()}`,
    title: currVal.sanitizedFileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
    fileName: currVal.sanitizedFileName,
    fileSizeBytes: currVal.sizeBytes,
    pageCount: currExtracted.totalPageCount,
    wordCount: currExtracted.wordCount,
  };

  return {
    id: `comparison-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    previousDocument,
    currentDocument,
    jurisdictionComparison,
    summary: {
      totalPreviousClauses: previousClauses.length,
      totalCurrentClauses: currentClauses.length,
      clausesChanged,
      clausesAdded,
      clausesRemoved,
      clausesMoved,
      clausesUnchanged,
      materialChangesCount,
      highSignificanceCount,
      mediumSignificanceCount,
      lowSignificanceCount,
      informationalCount,
    },
    changes,
    topMaterialChanges,
    analyzedAt: new Date().toISOString(),
    disclaimer: GLOBAL_LEGAL_DISCLAIMER,
  };
}
