import type { Clause, EvidenceLink, Finding } from "@/types";

export interface EvidenceMappingResult {
  evidenceLinks: EvidenceLink[];
  unmappedFindingsCount: number;
  mappingErrors: string[];
}

/**
 * Normalizes text for lenient whitespace-agnostic quote matching
 */
function normalizeForMatching(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Validates that an EvidenceLink connects to a real clause and contains
 * text actually present in the source clause.
 */
export function validateEvidenceLinkIntegrity(
  link: EvidenceLink,
  clause: Clause
): {
  isValid: boolean;
  error?: string;
} {
  if (link.clauseId !== clause.id) {
    return {
      isValid: false,
      error: `EvidenceLink clauseId mismatch: expected ${clause.id}, received ${link.clauseId}`,
    };
  }

  const normClause = normalizeForMatching(clause.rawText);
  const normQuote = normalizeForMatching(link.quotedText);

  if (!normQuote || normQuote.length < 10) {
    return {
      isValid: false,
      error: "Quoted text is too short or empty.",
    };
  }

  if (!normClause.includes(normQuote)) {
    return {
      isValid: false,
      error: `Quoted text is not present in clause ${clause.section}: "${link.quotedText.slice(0, 40)}..."`,
    };
  }

  return { isValid: true };
}

/**
 * Maps and validates evidence links for each Finding against the extracted clauses.
 * If pageNumber cannot be determined with certainty, sets pageNumber to null.
 */
export function mapFindingsToEvidence(
  findings: Omit<Finding, "evidence">[],
  clauses: Clause[],
  documentId: string
): {
  mappedFindings: Finding[];
  evidenceLinks: EvidenceLink[];
  mappingErrors: string[];
} {
  const clauseMap = new Map<string, Clause>(clauses.map((c) => [c.id, c]));
  const evidenceLinks: EvidenceLink[] = [];
  const mappedFindings: Finding[] = [];
  const mappingErrors: string[] = [];

  for (const f of findings) {
    const clause = clauseMap.get(f.clauseId);

    if (!clause) {
      mappingErrors.push(
        `Finding "${f.title}" references non-existent clauseId: ${f.clauseId}`
      );
      continue;
    }

    // Determine representative exact quote from the clause
    // Use first 150 chars or the most relevant sentence
    let quotedText = clause.rawText;
    const sentences = clause.rawText.split(/(?<=[.?!])\s+/);
    if (sentences.length > 0 && sentences[0].length >= 25) {
      quotedText = sentences.slice(0, 2).join(" ");
    }

    const evidenceLink: EvidenceLink = {
      findingId: f.id,
      documentId,
      clauseId: clause.id,
      section: clause.section,
      pageNumber: clause.pageNumber !== undefined ? clause.pageNumber : null,
      quotedText,
    };

    evidenceLinks.push(evidenceLink);

    mappedFindings.push({
      ...f,
      evidence: evidenceLink,
    });
  }

  return {
    mappedFindings,
    evidenceLinks,
    mappingErrors,
  };
}
