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
 * Common running header and footer patterns to filter out of extracted page text
 */
const RUNNING_HEADER_FOOTER_PATTERNS = [
  /^--\s*\d+\s*of\s*\d+\s*--$/i,
  /^Page\s*\d+\s*(?:of\s*\d+)?$/i,
  /^-\s*\d+\s*-$/,
  /^\d+\s*\/\s*\d+$/,
  /^\d+$/,
  /^[A-Z0-9\s.,|]+\|\s*CONFIDENTIAL(?:\s+DRAFT)?\s*$/i,
  /^CONFIDENTIAL(?:\s+DRAFT)?\s*$/i,
  /^Fictional training document/i,
  /^Not a real agreement/i,
];

/**
 * Heuristically categorizes a clause based on contractual keywords
 */
export function categorizeClauseByKeywords(title: string, text: string): ClauseCategory {
  const tLower = title.toLowerCase();
  const combined = `${title} ${text}`.toLowerCase();

  // Tier 1: Title-driven categorization (highest precision)
  if (tLower.includes("notice") || tLower.includes("garden leave") || tLower.includes("exit")) {
    return "notice";
  }
  if (
    tLower.includes("training") ||
    tLower.includes("reimburse") ||
    tLower.includes("salary") ||
    tLower.includes("compensation") ||
    tLower.includes("benefit") ||
    tLower.includes("fee")
  ) {
    return "payment";
  }
  if (
    tLower.includes("non-compete") ||
    tLower.includes("non-solicitation") ||
    tLower.includes("restriction") ||
    tLower.includes("restrictive covenant")
  ) {
    return "restriction";
  }
  if (
    tLower.includes("intellectual property") ||
    tLower.includes("invention") ||
    tLower.includes("patent") ||
    tLower.includes("copyright")
  ) {
    return "intellectual_property";
  }
  if (
    tLower.includes("confidential") ||
    tLower.includes("non-disclosure") ||
    tLower.includes("trade secret")
  ) {
    return "confidentiality";
  }
  if (
    tLower.includes("termination") ||
    tLower.includes("for cause") ||
    tLower.includes("severance")
  ) {
    return "termination";
  }
  if (
    tLower.includes("arbitrat") ||
    tLower.includes("dispute") ||
    tLower.includes("mediation")
  ) {
    return "dispute_resolution";
  }
  if (
    tLower.includes("governing law") ||
    tLower.includes("jurisdiction") ||
    tLower.includes("venue")
  ) {
    return "jurisdiction";
  }
  if (
    tLower.includes("appointment") ||
    tLower.includes("duties") ||
    tLower.includes("probation") ||
    tLower.includes("working hours") ||
    tLower.includes("remote") ||
    tLower.includes("confirmation")
  ) {
    return "employment";
  }
  if (
    tLower.includes("indemnif") ||
    tLower.includes("hold harmless")
  ) {
    return "indemnity";
  }
  if (
    tLower.includes("liability") ||
    tLower.includes("damages")
  ) {
    return "liability";
  }
  if (
    tLower.includes("entire agreement") ||
    tLower.includes("amendment") ||
    tLower.includes("policy") ||
    tLower.includes("order of precedence")
  ) {
    return "general";
  }

  // Tier 2: Body text keyword matching
  if (
    combined.includes("training fees") ||
    combined.includes("training reimbursement") ||
    combined.includes("reimbursement of the documented cost") ||
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
    combined.includes("non-compete") ||
    combined.includes("non-solicitation") ||
    combined.includes("restrictive covenant") ||
    combined.includes("competing business") ||
    combined.includes("solicit clients")
  ) {
    return "restriction";
  }

  if (
    combined.includes("intellectual property") ||
    combined.includes("inventions") ||
    combined.includes("prior inventions") ||
    combined.includes("copyright") ||
    combined.includes("work made for hire")
  ) {
    return "intellectual_property";
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
    combined.includes("notice period") ||
    combined.includes("days' notice") ||
    combined.includes("days notice") ||
    combined.includes("garden leave")
  ) {
    return "notice";
  }

  if (
    combined.includes("terminate employment") ||
    combined.includes("termination for cause") ||
    combined.includes("material misconduct")
  ) {
    return "termination";
  }

  if (
    combined.includes("indemnif") ||
    combined.includes("defend and indemnify")
  ) {
    return "indemnity";
  }

  if (
    combined.includes("limitation of liability") ||
    combined.includes("waiver of damages")
  ) {
    return "liability";
  }

  if (
    combined.includes("arbitrat") ||
    combined.includes("dispute resolution")
  ) {
    return "dispute_resolution";
  }

  if (
    combined.includes("governing law") ||
    combined.includes("jurisdiction") ||
    combined.includes("laws of india")
  ) {
    return "jurisdiction";
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
      lower.includes("deduct from wages") ||
      lower.includes("training fees") ||
      lower.includes("training expenditure"))
  ) {
    return "high_attention";
  }

  if (
    category === "restriction" ||
    (category === "intellectual_property" &&
      (lower.includes("all inventions") || lower.includes("sole and exclusive")))
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
 * Generates an intuitive, readable plain English summary of a clause based on its category and title
 */
function generatePlainEnglishSummary(section: string, title: string, category: ClauseCategory): string {
  const t = title.toLowerCase();
  if (t.includes("appointment") || t.includes("duties")) {
    return `Defines the employee's title, reporting obligations, responsibilities, and adherence to company policies.`;
  }
  if (t.includes("compensation") || t.includes("benefit") || t.includes("salary")) {
    return `Specifies base salary, variable pay components, bonuses, and benefits schedule.`;
  }
  if (t.includes("probation") || t.includes("confirmation")) {
    return `Establishes the initial probationary evaluation period and criteria for written confirmation.`;
  }
  if (t.includes("working hours") || t.includes("remote")) {
    return `Governs standard working hours, remote-work eligibility, and workplace telemetry/monitoring policies.`;
  }
  if (t.includes("notice") || t.includes("garden leave") || t.includes("exit")) {
    return `Sets advance written notice requirements for departure, garden leave terms, and exit protocols.`;
  }
  if (t.includes("training") || t.includes("reimbursement")) {
    return `Outlines conditions for reimbursement or recovery of company-sponsored training expenses upon early departure.`;
  }
  if (t.includes("confidential")) {
    return `Imposes strict non-disclosure obligations on proprietary technical, financial, and business information.`;
  }
  if (t.includes("intellectual property") || t.includes("invention")) {
    return `Defines company ownership of inventions, software, and works created during employment, with carve-outs for pre-existing projects.`;
  }
  if (t.includes("non-compete") || t.includes("restriction") || t.includes("post-employment")) {
    return `Places restrictions on providing competing services or soliciting clients after departure from the company.`;
  }
  if (t.includes("cause") || t.includes("misconduct")) {
    return `Details grounds for immediate termination due to material breach, fraud, or misconduct.`;
  }
  if (t.includes("arbitrat") || t.includes("dispute")) {
    return `Mandates informal dispute resolution followed by binding arbitration under applicable arbitration law.`;
  }
  if (t.includes("governing law") || t.includes("jurisdiction")) {
    return `Identifies the applicable legal jurisdiction and designated courts for interim legal relief.`;
  }
  if (t.includes("entire agreement") || t.includes("amendment")) {
    return `Confirms this document supersedes prior oral or written discussions; amendments require written consent.`;
  }
  if (t.includes("exhibit") || t.includes("schedule") || t.includes("annexure")) {
    return `Supplementary exhibit detailing specific schedules, itemized disclosures, or excluded personal inventions.`;
  }

  return `This provision (${section}) governs ${category.replace(/_/g, " ")}. Refer to original text for full legal terms.`;
}

/**
 * Determines which page a clause excerpt appears on
 */
export function findPageNumberForClause(
  rawText: string,
  pages: ExtractedPage[]
): number | null {
  if (!pages || pages.length === 0) return null;
  if (pages.length === 1) return pages[0].pageNumber;

  const snippet = rawText.slice(0, 50).replace(/\s+/g, " ").trim().toLowerCase();

  for (const p of pages) {
    const pageLower = p.text.toLowerCase().replace(/\s+/g, " ");
    if (pageLower.includes(snippet)) {
      return p.pageNumber;
    }
  }

  return null;
}

interface TaggedLine {
  line: string;
  pageNumber: number;
}

interface HeadingMatchResult {
  section: string;
  title: string;
  inlineBodyText?: string;
}

/**
 * Comprehensive heading patterns for legal agreements:
 * 1. SECTION 1, Section 1, SECTION 1 — TITLE, Section 1: Title
 * 2. 1. TITLE, 1. Title, 1 TITLE, 1.1 TITLE, 10. Title
 * 3. 1) Title, (1) Title, (a) Title
 * 4. ARTICLE I, Article 1, Clause 1
 * 5. EXHIBIT A, Exhibit A - Title, SCHEDULE 1, ANNEXURE A, APPENDIX 1
 * 6. Standalone uppercase legal section titles without numbers (e.g. CONFIDENTIALITY)
 */
function matchHeadingPattern(line: string): HeadingMatchResult | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 140) return null;

  // Pattern 1: Explicit keyword prefixes (SECTION, ARTICLE, CLAUSE, PARAGRAPH)
  // e.g., "SECTION 1. Appointment and Duties", "Section 5 - Notice Period"
  const keywordMatch = trimmed.match(
    /^(?:SECTION|ARTICLE|CLAUSE|PARAGRAPH)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[.:\s\-–—]*(.*)$/i
  );
  if (keywordMatch) {
    const num = keywordMatch[1].replace(/[.:\s]+$/, "");
    const remainder = (keywordMatch[2] || "").trim();
    const { title, inlineBody } = splitTitleAndInlineBody(remainder);
    return {
      section: `Section ${num}`,
      title: title || "Terms and Conditions",
      inlineBodyText: inlineBody,
    };
  }

  // Pattern 2: Exhibit, Schedule, Annexure, Appendix
  // e.g., "Exhibit A - Prior Inventions / Personal Projects", "Schedule 1: Benefits"
  const exhibitMatch = trimmed.match(
    /^(?:EXHIBIT|SCHEDULE|ANNEXURE|APPENDIX)\s+([A-Z0-9]+)[.:\s\-–—]*(.*)$/i
  );
  if (exhibitMatch) {
    const label = exhibitMatch[1].trim();
    const remainder = (exhibitMatch[2] || "").trim();
    const { title, inlineBody } = splitTitleAndInlineBody(remainder);
    return {
      section: `Exhibit ${label}`,
      title: title || "Supplementary Exhibit",
      inlineBodyText: inlineBody,
    };
  }

  // Pattern 3: Numbered sections like "1. Appointment and Duties", "1.1 Duties", "2. Term and Renewal. Body text..."
  const numberedMatch = trimmed.match(
    /^([0-9]{1,2}(?:\.[0-9]{1,2})*)\.?\s+(.+)$/
  );
  if (numberedMatch) {
    const num = numberedMatch[1].replace(/[.:\s]+$/, "");
    const remainder = numberedMatch[2].trim();
    const { title, inlineBody } = splitTitleAndInlineBody(remainder);
    if (title && /^[A-Z]/.test(title) && title.length <= 70) {
      return {
        section: `Section ${num}`,
        title,
        inlineBodyText: inlineBody,
      };
    }
  }

  // Pattern 4: Parenthesized numbers: "1) Title", "(1) Title", "1.1) Title"
  const parenMatch = trimmed.match(
    /^(?:\(?([0-9]{1,2})\)|\(?([0-9]{1,2}\.[0-9]{1,2})\))\s+(.+)$/
  );
  if (parenMatch) {
    const num = (parenMatch[1] || parenMatch[2]).replace(/[.:\s]+$/, "");
    const remainder = (parenMatch[3] || "").trim();
    const { title, inlineBody } = splitTitleAndInlineBody(remainder);
    if (title && /^[A-Z]/.test(title) && title.length <= 70) {
      return {
        section: `Section ${num}`,
        title,
        inlineBodyText: inlineBody,
      };
    }
  }

  // Pattern 5: Standalone Uppercase or Title-case Legal Headings without numbers
  // e.g. "CONFIDENTIALITY", "GOVERNING LAW AND JURISDICTION", "TERMINATION FOR CAUSE"
  // Length 4 to 60 characters, no ending period, must match known legal section terms
  if (
    trimmed.length >= 4 &&
    trimmed.length <= 60 &&
    !trimmed.endsWith(".") &&
    !trimmed.includes(":") &&
    /^[A-Z0-9\s\-–—&,/]+$/.test(trimmed)
  ) {
    const upper = trimmed.toUpperCase();
    const KNOWN_STANDALONE_HEADINGS = [
      "APPOINTMENT AND DUTIES",
      "COMPENSATION AND BENEFITS",
      "PROBATION AND CONFIRMATION",
      "WORKING HOURS AND REMOTE WORK",
      "NOTICE PERIOD, GARDEN LEAVE AND EXIT",
      "NOTICE PERIOD",
      "TRAINING AND REIMBURSEMENT",
      "CONFIDENTIALITY",
      "NON-DISCLOSURE",
      "INTELLECTUAL PROPERTY AND PRIOR INVENTIONS",
      "INTELLECTUAL PROPERTY",
      "POST-EMPLOYMENT RESTRICTIONS",
      "RESTRICTIVE COVENANTS",
      "NON-COMPETE",
      "TERMINATION FOR CAUSE",
      "TERMINATION",
      "DISPUTE RESOLUTION AND ARBITRATION",
      "DISPUTE RESOLUTION",
      "ARBITRATION",
      "GOVERNING LAW AND JURISDICTION",
      "GOVERNING LAW",
      "COMPANY POLICIES AND ORDER OF PRECEDENCE",
      "ENTIRE AGREEMENT AND AMENDMENTS",
      "ENTIRE AGREEMENT",
      "INDEMNIFICATION",
      "LIMITATION OF LIABILITY",
      "REPRESENTATIONS AND WARRANTIES",
      "SEVERABILITY",
    ];

    if (KNOWN_STANDALONE_HEADINGS.some((h) => upper === h || upper.startsWith(h))) {
      return {
        section: toTitleCase(trimmed),
        title: toTitleCase(trimmed),
      };
    }
  }

  return null;
}

/**
 * Splits inline headings where body text immediately follows the title on the same line
 * e.g., "Appointment and Duties. The Company appoints the Employee..."
 */
function splitTitleAndInlineBody(text: string): { title: string; inlineBody?: string } {
  if (!text) return { title: "" };

  // Check if title is followed by period, colon, or dash and a complete sentence (>= 5 words)
  const separatorMatch = text.match(/^(.+?)[.:\s\-–—]{2,}\s+(.+)$/);
  if (separatorMatch) {
    const potentialTitle = separatorMatch[1].trim();
    const potentialBody = separatorMatch[2].trim();
    if (potentialTitle.length < 50 && potentialBody.split(/\s+/).length >= 4) {
      return {
        title: potentialTitle,
        inlineBody: potentialBody,
      };
    }
  }

  // Check if text has a sentence ending period followed by capital letter
  const periodMatch = text.match(/^([^.]{3,60})\.\s+([A-Z].+)$/);
  if (periodMatch) {
    const potentialTitle = periodMatch[1].trim();
    const potentialBody = periodMatch[2].trim();
    if (potentialBody.split(/\s+/).length >= 4) {
      return {
        title: potentialTitle,
        inlineBody: potentialBody,
      };
    }
  }

  return { title: text.trim() };
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Determines whether a line matches common running header/footer noise
 */
function isRunningHeaderOrFooter(line: string): boolean {
  if (matchHeadingPattern(line)) return false;
  return RUNNING_HEADER_FOOTER_PATTERNS.some((pat) => pat.test(line));
}

/**
 * Segments document text into distinct, strongly-typed clauses
 * Preserves page numbers, handles multi-page clause continuity,
 * filters header/footer noise, and recognizes all standard legal heading styles.
 */
export function segmentDocumentIntoClauses(
  fullText: string,
  pages: ExtractedPage[],
  _documentId: string
): Clause[] {
  // Step 1: Build page-tagged line sequence
  const taggedLines: TaggedLine[] = [];

  if (pages && pages.length > 0) {
    for (const p of pages) {
      const pLines = p.text.split("\n");
      for (const rawLine of pLines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (isRunningHeaderOrFooter(line)) continue;
        taggedLines.push({
          line,
          pageNumber: p.pageNumber,
        });
      }
    }
  } else {
    // Fallback: split full text if pages array is unavailable
    const rawLines = fullText.split("\n");
    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (isRunningHeaderOrFooter(line)) continue;
      taggedLines.push({
        line,
        pageNumber: 0,
      });
    }
  }

  if (taggedLines.length === 0) {
    return [];
  }

  // Step 2: Segment lines into raw sections
  const rawSections: {
    section: string;
    title: string;
    pageNumber: number;
    bodyLines: string[];
  }[] = [];

  let currentSection = {
    section: "Preamble",
    title: "Recitals and Preamble",
    pageNumber: taggedLines[0].pageNumber,
    bodyLines: [] as string[],
  };

  for (let i = 0; i < taggedLines.length; i++) {
    const { line, pageNumber } = taggedLines[i];

    // Check for two-line headings (e.g. Line 1: "Section 1", Line 2: "Appointment and Duties")
    const standaloneNumberMatch = line.match(
      /^(?:SECTION|ARTICLE|CLAUSE|PARAGRAPH)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)$/i
    );
    if (standaloneNumberMatch && i + 1 < taggedLines.length) {
      const nextLine = taggedLines[i + 1].line.trim();
      if (
        nextLine.length > 0 &&
        nextLine.length <= 70 &&
        !nextLine.endsWith(".") &&
        /^[A-Z][\w\s,/'"&\-\(\)]+$/.test(nextLine)
      ) {
        if (currentSection.bodyLines.length > 0 || currentSection.section !== "Preamble") {
          rawSections.push(currentSection);
        }
        currentSection = {
          section: `Section ${standaloneNumberMatch[1]}`,
          title: nextLine,
          pageNumber,
          bodyLines: [],
        };
        i++; // Skip title line since it was incorporated
        continue;
      }
    }

    // Check standard heading pattern
    const heading = matchHeadingPattern(line);
    if (heading) {
      if (currentSection.bodyLines.length > 0 || currentSection.section !== "Preamble") {
        rawSections.push(currentSection);
      }

      currentSection = {
        section: heading.section,
        title: heading.title,
        pageNumber,
        bodyLines: heading.inlineBodyText ? [heading.inlineBodyText] : [],
      };
      continue;
    }

    currentSection.bodyLines.push(line);
  }

  if (currentSection.bodyLines.length > 0 || currentSection.section !== "Preamble") {
    rawSections.push(currentSection);
  }

  // Step 3: Build strongly-typed Clause records
  const seenSections = new Set<string>();
  const clauses: Clause[] = [];

  for (let idx = 0; idx < rawSections.length; idx++) {
    const s = rawSections[idx];
    const rawText = s.bodyLines.join(" ").replace(/\s+/g, " ").trim();

    // Skip preamble if it has no meaningful text
    if (s.section === "Preamble" && rawText.length < 15 && rawSections.length > 1) {
      continue;
    }

    if (rawText.length < 15 && s.section !== "Preamble") {
      // Very short section: still record if it has a valid title
      if (s.title.length < 3) continue;
    }

    // Deduplication check: prevent identical duplicate clauses
    const dedupKey = `${s.section}::${rawText.slice(0, 100)}`;
    if (seenSections.has(dedupKey)) {
      continue;
    }
    seenSections.add(dedupKey);

    const baseId = `clause-${s.section.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${idx}`;
    const category = categorizeClauseByKeywords(s.title, rawText);
    const importance = scoreClauseImportance(category, rawText);
    const plainEnglish = generatePlainEnglishSummary(s.section, s.title, category);

    // If pages is empty, pageNumber must be null
    const hasPages = pages && pages.length > 0;
    const finalPage = hasPages
      ? (s.pageNumber > 0 ? s.pageNumber : findPageNumberForClause(rawText, pages) || 1)
      : null;

    clauses.push({
      id: baseId,
      section: s.section,
      title: s.title,
      rawText,
      plainEnglish,
      category,
      pageNumber: finalPage,
      importance,
      sectionNumber: s.section,
      plainEnglishSummary: plainEnglish,
      highlightedRisk: importance,
    });
  }

  // Step 4: Fallback guard: if segmentation produced 0 clauses, wrap full text
  if (clauses.length === 0 && fullText.trim().length > 0) {
    const cleanFull = fullText.replace(/\s+/g, " ").trim();
    const category = categorizeClauseByKeywords("Agreement", cleanFull);
    const importance = scoreClauseImportance(category, cleanFull);
    const hasPages = pages && pages.length > 0;
    clauses.push({
      id: `clause-agreement-0`,
      section: "Agreement",
      title: "General Terms and Conditions",
      rawText: cleanFull,
      plainEnglish: `Complete contractual text extracted from document.`,
      category,
      pageNumber: hasPages ? 1 : null,
      importance,
      sectionNumber: "Agreement",
      plainEnglishSummary: `Complete contractual text.`,
      highlightedRisk: importance,
    });
  }

  return clauses;
}
