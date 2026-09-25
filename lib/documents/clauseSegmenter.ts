import type { Clause, ClauseCategory, ImportanceLevel } from "@/types";
import type { ExtractedPage } from "./textExtractor";
import { splitSentences } from "@/lib/utils";

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
 * Deterministic plain-English lead-in for a clause, derived ONLY from the clause's own text.
 * (Live AI replaces this with a real summary; this must never assume a document type or claim
 * terms the clause does not contain.)
 */
function generatePlainEnglishSummary(section: string, title: string, category: ClauseCategory, rawText: string): string {
  const sentences = splitSentences(rawText);
  const lead = sentences[0] ? sentences[0].replace(/\s+/g, " ").trim() : "";
  if (!lead) {
    return `${section} covers ${title.toLowerCase() || category.replace(/_/g, " ")}; see the original text for the exact terms.`;
  }
  const clipped = lead.length > 220 ? `${lead.slice(0, 217).replace(/\s+\S*$/, "")}…` : lead;
  return `${section} (${title}): ${clipped}`;
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
  /** Set for plain top-level integer headings ("4." / "Section 4"); drives sequence tracking. */
  topNumber?: number;
  /** A numbered paragraph with no heading of its own; its title is derived from its opening words. */
  untitled?: boolean;
}

/**
 * Running state the segmenter carries between lines so numbering can be judged in context:
 * a wrapped "1 March 2026 ..." line or a "2.1 ..." sub-clause is not a new top-level section.
 */
interface HeadingContext {
  /** The last accepted top-level integer heading number (0 before the first). */
  lastTop: number;
  /**
   * Set while inside a numbered list that restarted at "1." within a section: the number the next
   * list item is expected to carry, so "2." and "3." of that list are not mistaken for sections.
   */
  listNext?: number;
  /** Typical (90th percentile) line length of the document; wrapped text hugs it, headings do not. */
  wrapWidth?: number;
}

const MONTH_THEN_NUMBER =
  /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d/i;
const LEADING_UNIT =
  /^(?:days?|weeks?|months?|years?|hours?|lakhs?|crores?|per\s?cent|percent|%|calendar|business|working|times|rupees|dollars|only)\b/i;
/** Words that make a phrase a sentence rather than a heading. */
const VERBISH = /\b(?:shall|will|may|must|is|are|was|were|has|have|hereby|agrees?|pays?|grants?|undertakes?)\b/i;

/** Highest gap allowed between consecutive top-level numbers (tolerates a section lost to extraction). */
const MAX_TOP_LEVEL_GAP = 5;

function looksLikeTitle(text: string): boolean {
  const t = text.replace(/[.:]+$/, "").trim();
  if (!t || t.length > 70 || !/^[A-Z0-9"“'(]/.test(t)) return false;
  if (t.split(/\s+/).length > 9) return false;
  return !VERBISH.test(t);
}

/** A short label for a numbered paragraph that carries no heading of its own. */
function deriveTitleFromSentence(sentence: string): string {
  const words = sentence
    .replace(/^(?:that|the|each|either)\s+/i, "")
    .replace(/[.;:,]+$/, "")
    .split(/\s+/)
    .filter(Boolean);
  const head = words.slice(0, 6).join(" ").replace(/[.;:,]+$/, "");
  const title = head.charAt(0).toUpperCase() + head.slice(1);
  return words.length > 6 ? `${title}…` : title;
}

/**
 * Decides what follows a heading number: an inline "Title. Body", a bare title, or (for numbered
 * paragraphs such as "1. The Licensee shall pay…") an untitled clause whose whole text is the body.
 */
function analyzeNumberedRemainder(
  remainder: string,
  allowUntitled: boolean,
  atLineWidth = false
): { title: string; inlineBody?: string; untitled?: boolean } | null {
  const rem = remainder.trim();
  if (!rem || !/^[A-Z0-9"“'(]/.test(rem)) return null;
  if (MONTH_THEN_NUMBER.test(rem) || LEADING_UNIT.test(rem)) return null;

  const split = splitTitleAndInlineBody(rem);
  if (split.inlineBody && looksLikeTitle(split.title)) {
    return { title: split.title.replace(/[.:]+$/, "").trim(), inlineBody: split.inlineBody };
  }

  const wordCount = rem.split(/\s+/).length;
  // A line that fills the document's usual line width and reads like the start of a sentence is the
  // first wrapped line of a numbered paragraph, not a heading.
  const wrappedParagraphStart = atLineWidth && !isHeadingShaped(rem);
  if (
    !wrappedParagraphStart &&
    rem.length <= 70 &&
    wordCount <= 9 &&
    looksLikeTitle(rem) &&
    (wordCount <= 6 || !rem.endsWith("."))
  ) {
    return { title: rem.replace(/[.:]+$/, "").trim() };
  }

  if (allowUntitled && wordCount >= 4) {
    return { title: deriveTitleFromSentence(rem), inlineBody: rem, untitled: true };
  }
  return null;
}

const TITLE_CONNECTORS = new Set(["a", "an", "the", "of", "and", "or", "for", "to", "in", "on", "at", "by", "with", "from", "as", "&"]);

/** True for text shaped like a heading: ALL CAPS, or Title Case ("Fees and Payment"). */
function isHeadingShaped(title: string): boolean {
  const t = title.replace(/[.:]+$/, "").trim();
  if (!t || t.includes(";")) return false;
  if (!/[a-z]/.test(t)) return true;
  const significant = t.split(/\s+/).filter((w) => !TITLE_CONNECTORS.has(w.toLowerCase()));
  if (significant.length === 0) return false;
  const capitalized = significant.filter((w) => /^[A-Z0-9"“'(]/.test(w)).length;
  return capitalized / significant.length >= 0.6;
}

/** Line openings that begin a new section rather than continue a wrapped heading. */
const STARTS_NUMBERED_OR_KEYWORD = /^(?:\d|\(\d|(?:section|article|clause|paragraph|exhibit|schedule|annexure|appendix)\s)/i;

/** A title that ends on a connector ("… AND LIMITATION OF") is continued on the next line. */
function titleContinuesOnNextLine(title: string): boolean {
  const last = title.trim().split(/\s+/).pop()?.toLowerCase().replace(/[.,]+$/, "") ?? "";
  return TITLE_CONNECTORS.has(last);
}

function atLineWidth(line: string, ctx?: HeadingContext): boolean {
  return Boolean(ctx?.wrapWidth && line.length >= ctx.wrapWidth * 0.8);
}

/** The top-level number of a delimited numbered line ("3." / "3)" / "(3)"), or undefined. */
function delimitedTopLevelNumber(line: string): number | undefined {
  const m = line.trim().match(/^(?:\((\d{1,2})\)|(\d{1,2})[.)])\s+\S/);
  return m ? Number(m[1] || m[2]) : undefined;
}

/**
 * Comprehensive heading patterns for legal agreements:
 * 1. SECTION 1, Section 1, SECTION 1 — TITLE, Section 1: Title, Article IV, Clause 3
 * 2. EXHIBIT A, Exhibit A - Title, SCHEDULE 1, ANNEXURE A, APPENDIX 1
 * 3. Numbered sections: "1. Title", "1 Title", "1) Title", "(1) Title", "1. Title. Body…",
 *    and untitled numbered paragraphs ("1. The Licensee shall…")
 * 4. Decimal sub-clauses ("2.1 …") are body text of their parent section whenever that parent is
 *    the current top-level section; otherwise they are headings in their own right
 * 5. Roman numeral headings with upper-case titles ("IV. TERMINATION")
 * 6. Standalone uppercase legal section titles without numbers (e.g. CONFIDENTIALITY)
 *
 * Numbering is judged in context (`ctx`): top-level numbers must advance (a date such as
 * "1 March 2026" wrapped onto its own line, or a list restarting at "1.", is not a heading).
 * Without `ctx` numbering is not sequence-checked.
 */
function matchHeadingPattern(line: string, ctx?: HeadingContext): HeadingMatchResult | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Pattern 1: Explicit keyword prefixes (SECTION, ARTICLE, CLAUSE, PARAGRAPH)
  // e.g., "SECTION 1. Appointment and Duties", "Section 5 - Notice Period"
  const keywordLead = trimmed.match(/^(?:section|article|clause|paragraph)\s+/i);
  if (keywordLead) {
    const rest = trimmed.slice(keywordLead[0].length);
    const numeral = rest.match(/^(\d+(?:\.\d+)*|[IVXLCDM]+)(?![A-Za-z0-9])[.:\s\-–—]*(.*)$/);
    if (numeral) {
      const num = numeral[1].replace(/[.:\s]+$/, "");
      const remainder = (numeral[2] || "").trim();
      // "Section 5 above shall apply" / "Clause 3 of this Agreement" are references, not headings.
      if (remainder && /^[a-z]/.test(remainder)) return null;
      const { title, inlineBody } = splitTitleAndInlineBody(remainder);
      return {
        section: `Section ${num}`,
        title: (title || "Terms and Conditions").replace(/[.:]+$/, "").trim(),
        inlineBodyText: inlineBody,
        topNumber: /^\d+$/.test(num) ? Number(num) : undefined,
      };
    }
  }

  // Pattern 2: Exhibit, Schedule, Annexure, Appendix
  // e.g., "Exhibit A - Prior Inventions / Personal Projects", "Schedule 1: Benefits"
  const exhibitLead = trimmed.match(/^(?:exhibit|schedule|annexure|appendix)\s+/i);
  if (exhibitLead) {
    const rest = trimmed.slice(exhibitLead[0].length);
    const label = rest.match(/^([A-Z]{1,2}|\d{1,2})(?![A-Za-z0-9])[.:\s\-–—]*(.*)$/);
    if (label) {
      const remainder = (label[2] || "").trim();
      if (!remainder || !/^[a-z]/.test(remainder)) {
        const { title, inlineBody } = splitTitleAndInlineBody(remainder);
        return {
          section: `Exhibit ${label[1]}`,
          title: title || "Supplementary Exhibit",
          inlineBodyText: inlineBody,
        };
      }
    }
  }

  // Pattern 3/4: Numbered sections — "1. Title", "1.1 Title", "1) Title", "(1) Title".
  const numbered = trimmed.match(/^(?:\((\d{1,2})\)|(\d{1,2}(?:\.\d{1,2})*)([.)])?)\s+(.+)$/);
  if (numbered) {
    const num = (numbered[1] || numbered[2]).replace(/[.:\s]+$/, "");
    const hasDelimiter = Boolean(numbered[1] || numbered[3]);
    const first = Number(num.split(".")[0]);

    if (num.includes(".")) {
      // "2.1 …" inside section 2 is part of section 2.
      if (ctx && ctx.lastTop > 0 && first === ctx.lastTop) return null;
      const parsed = analyzeNumberedRemainder(numbered[4], true, atLineWidth(trimmed, ctx));
      if (!parsed) return null;
      return {
        section: `Section ${num}`,
        title: parsed.title,
        inlineBodyText: parsed.inlineBody,
        untitled: parsed.untitled,
      };
    }

    if (ctx) {
      const step = first - ctx.lastTop;
      if (step < 1 || step > MAX_TOP_LEVEL_GAP) return null;
    }
    // Untitled numbered paragraphs and delimiter-less "1 Title" lines must be the exact next number.
    const isNextNumber = !ctx || first === ctx.lastTop + 1;
    if (!hasDelimiter && !isNextNumber) return null;
    const parsed = analyzeNumberedRemainder(numbered[4], hasDelimiter && isNextNumber, atLineWidth(trimmed, ctx));
    if (!parsed) return null;
    // Continuing a list that restarted inside the current section: only a heading-shaped line that is
    // also exactly the next section number is allowed to break out of it.
    if (ctx && ctx.listNext === first && !(isNextNumber && !parsed.untitled && isHeadingShaped(parsed.title))) {
      return null;
    }
    return {
      section: `Section ${num}`,
      title: parsed.title,
      inlineBodyText: parsed.inlineBody,
      topNumber: first,
      untitled: parsed.untitled,
    };
  }

  // Pattern 5: Roman numeral headings with an upper-case title: "IV. TERMINATION AND NOTICE"
  const roman = trimmed.match(/^([IVX]{1,5})[.)]\s+([A-Z][A-Z0-9\s,&/'\-–—]{2,60})$/);
  if (roman) {
    return { section: `Section ${roman[1]}`, title: toTitleCase(roman[2].trim()) };
  }

  // Pattern 6: Standalone Uppercase or Title-case Legal Headings without numbers
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
 * A section number standing alone on its own line, with the heading title on the next line:
 *   "1."   or   "Section 1"        →   "Licensed Premises"
 * A bare number without "." or ")" is indistinguishable from a page number and is not accepted.
 */
function matchStandaloneNumberLine(line: string): { section: string; topNumber?: number } | null {
  const keyword = line.match(/^(?:SECTION|ARTICLE|CLAUSE|PARAGRAPH)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)$/i);
  if (keyword) {
    return { section: `Section ${keyword[1]}`, topNumber: /^\d+$/.test(keyword[1]) ? Number(keyword[1]) : undefined };
  }
  const bare = line.match(/^(\d{1,2})[.)]$/);
  if (bare) return { section: `Section ${bare[1]}`, topNumber: Number(bare[1]) };
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
  interface RawSection {
    section: string;
    title: string;
    pageNumber: number;
    bodyLines: string[];
    untitled?: boolean;
  }
  const rawSections: RawSection[] = [];

  let currentSection: RawSection = {
    section: "Preamble",
    title: "Recitals and Preamble",
    pageNumber: taggedLines[0].pageNumber,
    bodyLines: [],
  };

  const lineLengths = taggedLines.map((t) => t.line.length).sort((a, b) => a - b);
  const headingContext: HeadingContext = {
    lastTop: 0,
    wrapWidth: lineLengths[Math.floor((lineLengths.length - 1) * 0.9)],
  };

  for (let i = 0; i < taggedLines.length; i++) {
    const { line, pageNumber } = taggedLines[i];

    // Check for two-line headings (e.g. Line 1: "Section 1" or "1.", Line 2: "Appointment and Duties")
    const standaloneNumber = matchStandaloneNumberLine(line);
    if (standaloneNumber && i + 1 < taggedLines.length) {
      const nextLine = taggedLines[i + 1].line.trim();
      const step = (standaloneNumber.topNumber ?? headingContext.lastTop + 1) - headingContext.lastTop;
      if (
        step >= 1 &&
        step <= MAX_TOP_LEVEL_GAP &&
        nextLine.length > 0 &&
        nextLine.length <= 70 &&
        !nextLine.endsWith(".") &&
        /^[A-Z][\w\s,/'"&\-\(\)]+$/.test(nextLine) &&
        !matchHeadingPattern(nextLine, headingContext)
      ) {
        if (currentSection.bodyLines.length > 0 || currentSection.section !== "Preamble") {
          rawSections.push(currentSection);
        }
        currentSection = {
          section: standaloneNumber.section,
          title: nextLine,
          pageNumber,
          bodyLines: [],
        };
        if (standaloneNumber.topNumber !== undefined) headingContext.lastTop = standaloneNumber.topNumber;
        i++; // Skip title line since it was incorporated
        continue;
      }
    }

    // Check standard heading pattern
    const heading = matchHeadingPattern(line, headingContext);
    if (heading) {
      if (currentSection.bodyLines.length > 0 || currentSection.section !== "Preamble") {
        rawSections.push(currentSection);
      }
      if (heading.topNumber !== undefined) headingContext.lastTop = heading.topNumber;
      headingContext.listNext = undefined;

      let title = heading.title;
      // A long heading wrapped over two lines ("7. INDEMNIFICATION AND LIMITATION OF" / "LIABILITY").
      while (!heading.inlineBodyText && titleContinuesOnNextLine(title) && i + 1 < taggedLines.length) {
        const next = taggedLines[i + 1].line.trim();
        if (next.length > 60 || !/^[A-Z]/.test(next) || next.endsWith(".") || STARTS_NUMBERED_OR_KEYWORD.test(next)) break;
        title = `${title} ${next}`;
        i++;
      }

      currentSection = {
        section: heading.section,
        title,
        pageNumber,
        bodyLines: heading.inlineBodyText ? [heading.inlineBodyText] : [],
        untitled: heading.untitled,
      };
      continue;
    }

    // A delimited number that was not accepted as a heading, but restarts or continues a list, keeps
    // the list cursor moving so its later items stay inside the section.
    const listNumber = delimitedTopLevelNumber(line);
    if (listNumber !== undefined && (listNumber <= headingContext.lastTop || listNumber === headingContext.listNext)) {
      headingContext.listNext = listNumber + 1;
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
    // Untitled numbered paragraphs are labelled from the whole paragraph, so the label does not depend on
    // where a PDF happened to wrap its first line.
    if (s.untitled) s.title = deriveTitleFromSentence(rawText);
    const category = categorizeClauseByKeywords(s.title, rawText);
    const importance = scoreClauseImportance(category, rawText);
    const plainEnglish = generatePlainEnglishSummary(s.section, s.title, category, rawText);

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
