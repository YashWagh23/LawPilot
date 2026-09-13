import type { Clause, ClauseCategory, ImportanceLevel } from "@/types";
import type { ExtractedPage } from "./textExtractor";

export interface SegmentedSection {
  section: string;
  title: string;
  rawText: string;
  pageNumber: number | null;
  category: ClauseCategory;
  importance: ImportanceLevel;
}

/**
 * Heuristically categorizes a clause based on contractual keywords
 */
export function categorizeClauseByKeywords(title: string, text: string): ClauseCategory {
  const combined = `${title} ${text}`.toLowerCase();

  if (
    combined.includes("salary") ||
    combined.includes("compensation") ||
    combined.includes("fee") ||
    combined.includes("deposit") ||
    combined.includes("reimburse") ||
    combined.includes("invoice")
  ) {
    return "payment";
  }

  if (
    combined.includes("terminate") ||
    combined.includes("termination") ||
    combined.includes("probation") ||
    combined.includes("at-will") ||
    combined.includes("discharge")
  ) {
    return "termination";
  }

  if (
    combined.includes("notice period") ||
    combined.includes("written notice") ||
    combined.includes("notice of resignation") ||
    combined.includes("days' notice") ||
    combined.includes("days notice")
  ) {
    return "notice";
  }

  if (
    combined.includes("confidential") ||
    combined.includes("non-disclosure") ||
    combined.includes("trade secret") ||
    combined.includes("proprietary information")
  ) {
    return "confidentiality";
  }

  if (
    combined.includes("intellectual property") ||
    combined.includes("inventions") ||
    combined.includes("copyright") ||
    combined.includes("patent") ||
    combined.includes("work made for hire")
  ) {
    return "intellectual_property";
  }

  if (
    combined.includes("non-compete") ||
    combined.includes("non-solicitation") ||
    combined.includes("restrictive covenant") ||
    combined.includes("competing business") ||
    combined.includes("solicit clients")
  ) {
    return "restriction";
  }

  if (
    combined.includes("indemnif") ||
    combined.includes("hold harmless") ||
    combined.includes("defend and indemnify")
  ) {
    return "indemnity";
  }

  if (
    combined.includes("limitation of liability") ||
    combined.includes("waiver of damages") ||
    combined.includes("consequential damages")
  ) {
    return "liability";
  }

  if (
    combined.includes("arbitrat") ||
    combined.includes("dispute resolution") ||
    combined.includes("mediation") ||
    combined.includes("jury trial waiver")
  ) {
    return "dispute_resolution";
  }

  if (
    combined.includes("governing law") ||
    combined.includes("jurisdiction") ||
    combined.includes("venue") ||
    combined.includes("choice of law")
  ) {
    return "jurisdiction";
  }

  if (
    combined.includes("renew") ||
    combined.includes("extension") ||
    combined.includes("automatic renewal")
  ) {
    return "renewal";
  }

  if (
    combined.includes("duties") ||
    combined.includes("reporting") ||
    combined.includes("employment term") ||
    combined.includes("position")
  ) {
    return "employment";
  }

  if (combined.includes("privacy") || combined.includes("gdpr") || combined.includes("personal data")) {
    return "data_privacy";
  }

  return "general";
}

/**
 * Heuristically scores clause importance
 */
export function scoreClauseImportance(
  category: ClauseCategory,
  text: string
): ImportanceLevel {
  const lower = text.toLowerCase();

  // Critical / High Attention indicators
  if (
    category === "termination" &&
    (lower.includes("pay immediately") ||
      lower.includes("liquidated damages") ||
      lower.includes("forfeit") ||
      lower.includes("penalty"))
  ) {
    return "critical_attention";
  }

  if (
    category === "payment" &&
    (lower.includes("reimburse") ||
      lower.includes("repayment") ||
      lower.includes("penalty") ||
      lower.includes("deduct from wages"))
  ) {
    return "high_attention";
  }

  if (
    category === "restriction" ||
    (category === "intellectual_property" && lower.includes("all inventions"))
  ) {
    return "high_attention";
  }

  if (category === "indemnity" || category === "liability") {
    return "review";
  }

  if (category === "notice" || category === "dispute_resolution") {
    return "review";
  }

  if (category === "jurisdiction" || category === "confidentiality") {
    return "context_dependent";
  }

  return "informational";
}

/**
 * Determines which page a clause excerpt appears on
 */
function findPageNumberForClause(
  rawText: string,
  pages: ExtractedPage[]
): number | null {
  if (!pages || pages.length === 0) return null;
  if (pages.length === 1) return pages[0].pageNumber;

  // Use a distinctive 40-char snippet from the beginning of the clause
  const snippet = rawText.slice(0, 50).replace(/\s+/g, " ").trim().toLowerCase();

  for (const p of pages) {
    const pageLower = p.text.toLowerCase().replace(/\s+/g, " ");
    if (pageLower.includes(snippet)) {
      return p.pageNumber;
    }
  }

  return null;
}

/**
 * Segments document text into distinct, strongly-typed clauses
 */
export function segmentDocumentIntoClauses(
  fullText: string,
  pages: ExtractedPage[],
  _documentId: string
): Clause[] {
  const lines = fullText.split("\n");
  const rawSections: {
    section: string;
    title: string;
    bodyLines: string[];
  }[] = [];

  // Patterns to detect section boundaries
  const SECTION_PATTERNS = [
    /^(?:SECTION|ARTICLE|CLAUSE|PARAGRAPH)\s+([0-9IVXLCDM\.]+)[.:\s\-–—]*(.*)$/i,
    /^([0-9]{1,2}\.[0-9]{1,2}(?:\.[0-9]+)?)[.:\s\-–—]+(.*)$/,
  ];

  let currentSection = {
    section: "Preamble",
    title: "Recitals and Preamble",
    bodyLines: [] as string[],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let matched = false;
    for (const pattern of SECTION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Save previous section if it has body
        if (currentSection.bodyLines.length > 0) {
          rawSections.push(currentSection);
        }

        const cleanNumber = match[1].replace(/[.:\s]+$/, "");
        const sectionNum = `Section ${cleanNumber}`.trim();
        const sectionTitle = match[2]?.trim() || "Terms and Conditions";

        currentSection = {
          section: sectionNum,
          title: sectionTitle,
          bodyLines: [],
        };
        matched = true;
        break;
      }
    }

    if (!matched) {
      currentSection.bodyLines.push(line);
    }
  }

  // Push the final section
  if (currentSection.bodyLines.length > 0) {
    rawSections.push(currentSection);
  }

  // Deduplication check: map by section number
  const seenSections = new Set<string>();
  const clauses: Clause[] = [];

  for (let idx = 0; idx < rawSections.length; idx++) {
    const s = rawSections[idx];
    const rawText = s.bodyLines.join(" ").replace(/\s+/g, " ").trim();

    if (rawText.length < 15) continue; // Skip trivial noise lines

    // Generate unique ID
    const baseId = `clause-${s.section.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${idx}`;
    if (seenSections.has(rawText)) {
      continue; // Skip exact duplicate clauses
    }
    seenSections.add(rawText);

    const pageNumber = findPageNumberForClause(rawText, pages);
    const category = categorizeClauseByKeywords(s.title, rawText);
    const importance = scoreClauseImportance(category, rawText);

    clauses.push({
      id: baseId,
      section: s.section,
      title: s.title,
      rawText: rawText,
      plainEnglish: `This provision (${s.section}) governs ${category.replace(/_/g, " ")}. Refer to original text for specific terms.`,
      category,
      pageNumber,
      importance,
      sectionNumber: s.section,
      plainEnglishSummary: `This provision (${s.section}) governs ${category.replace(/_/g, " ")}.`,
      highlightedRisk: importance,
    });
  }

  return clauses;
}
