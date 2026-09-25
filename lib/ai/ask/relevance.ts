import type { AnalysisReport, Clause, EvidenceChain, Finding } from "@/types";
import { splitSentences } from "@/lib/utils";

/**
 * Question → document relevance ranking for Ask LawPilot.
 *
 * Replaces substring matching (where "ip" matched "ship" and "period" matched every notice
 * clause) with token-level scoring: exact section references, title/category hits, synonym
 * groups per legal topic, and the caller's selected clause/finding.
 */

const STOPWORDS = new Set([
  "the", "and", "for", "are", "was", "with", "that", "this", "what", "when", "how", "why", "who", "can", "does",
  "did", "you", "your", "our", "have", "has", "had", "not", "but", "any", "all", "from", "into", "about", "would",
  "could", "should", "will", "may", "might", "must", "there", "their", "them", "they", "his", "her", "its", "than",
  "then", "out", "off", "over", "under", "again", "very", "just", "also", "some", "such", "only", "own", "same",
  "too", "now", "per", "ask", "tell", "explain", "mean", "means", "say", "says", "much", "many", "clause",
  "section", "agreement", "contract", "document", "flagged", "please", "which", "where", "whether",
]);

const SHORT_TOPIC_WORDS = new Set(["ip", "hr", "pf", "nda"]);

/** Topic synonym groups. A query token in a group also matches the rest of the group at lower weight. */
const TOPIC_GROUPS: Record<string, string[]> = {
  notice: ["notice", "resign", "resignation", "terminate", "termination", "exit", "leave", "quit", "depart", "departure"],
  training: ["training", "bond", "reimburse", "reimbursement", "repay", "repayment", "recover", "recoup", "clawback", "liquidated"],
  restraint: ["compete", "competition", "competing", "competitor", "restrictive", "restraint", "solicit", "solicitation", "covenant", "exclusivity"],
  ip: ["intellectual", "invention", "inventions", "copyright", "patent", "ownership", "assign", "assignment", "deliverable", "deliverables", "work product"],
  dispute: ["arbitration", "arbitrator", "dispute", "court", "courts", "forum", "venue", "jurisdiction", "litigation"],
  payment: ["salary", "pay", "payment", "fee", "fees", "rent", "deposit", "compensation", "price", "invoice", "remuneration", "cost", "charges"],
  confidentiality: ["confidential", "confidentiality", "secret", "secrets", "disclose", "disclosure", "nda"],
  liability: ["liable", "liability", "indemnity", "indemnify", "damages", "loss", "insurance"],
  renewal: ["renew", "renewal", "term", "extend", "extension", "lock", "lockin", "expiry", "expire"],
  law: ["governing", "law", "laws", "governed", "applicable"],
  privacy: ["data", "privacy", "personal", "gdpr"],
};

const CATEGORY_TO_GROUP: Record<string, string> = {
  notice: "notice",
  termination: "notice",
  payment: "payment",
  restriction: "restraint",
  intellectual_property: "ip",
  dispute_resolution: "dispute",
  jurisdiction: "law",
  confidentiality: "confidentiality",
  indemnity: "liability",
  liability: "liability",
  renewal: "renewal",
  data_privacy: "privacy",
};

/** Cheap prefix stem so "terminated"/"termination" and "resigned"/"resignation" agree. */
function stem(word: string): string {
  return word.length > 6 ? word.slice(0, 6) : word;
}

export function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, " ")
        .split(/\s+/)
        .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
        .filter((w) => (w.length >= 3 || SHORT_TOPIC_WORDS.has(w)) && !STOPWORDS.has(w))
        .map(stem)
    )
  );
}

function groupsForTokens(tokens: string[]): Set<string> {
  const groups = new Set<string>();
  for (const [name, words] of Object.entries(TOPIC_GROUPS)) {
    if (words.some((w) => tokens.includes(stem(w)))) groups.add(name);
  }
  return groups;
}

const wordHit = (haystack: string, token: string): boolean =>
  new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(haystack);

export interface RankedClause {
  clause: Clause;
  score: number;
  finding?: Finding;
  chain?: EvidenceChain;
}

export interface QuestionFocus {
  clauseId?: string;
  findingId?: string;
}

/** Extracts an explicit "section 8" / "clause 4.2" reference from the question. */
export function extractSectionReference(question: string): string | null {
  const m = question.match(/\b(?:section|clause|article|sec\.?|para(?:graph)?)\s*([0-9]+(?:\.[0-9]+)*[a-z]?)\b/i);
  return m ? m[1].toLowerCase() : null;
}

function sectionNumberOf(clause: Clause): string {
  return (clause.sectionNumber || clause.section || "").toLowerCase().replace(/^(?:section|clause|article|paragraph)\s*/i, "").trim();
}

export function findingForClause(report: AnalysisReport, clauseId: string): Finding | undefined {
  return report.findings.find((f) => f.clauseId === clauseId || f.evidence?.clauseId === clauseId);
}

export function chainForFinding(report: AnalysisReport, finding?: Finding): EvidenceChain | undefined {
  if (!finding) return undefined;
  return (report.evidenceChains || []).find(
    (c) => c.finding?.id === finding.id || c.id === finding.id || c.finding?.clauseId === finding.clauseId
  );
}

/**
 * Ranks the report's clauses for a question. A score of 0 means "no relevant clause found",
 * which callers must treat as "the document does not appear to address this".
 */
export function rankClauses(report: AnalysisReport, question: string, focus?: QuestionFocus): RankedClause[] {
  const tokens = tokenize(question);
  const groups = groupsForTokens(tokens);
  const targetSection = extractSectionReference(question);

  // A word found in only one or two clauses is a distinctive subject of the question ("pets"),
  // so a body-text hit on it is strong evidence; common words are weak evidence.
  const docFrequency = new Map<string, number>();
  for (const token of tokens) {
    if (/^\d+$/.test(token)) continue;
    docFrequency.set(
      token,
      report.clauses.filter((c) => wordHit((c.rawText || c.clauseText || "").toLowerCase(), token)).length
    );
  }

  const ranked: RankedClause[] = report.clauses.map((clause) => {
    let score = 0;
    const title = (clause.title || "").toLowerCase();
    const text = (clause.rawText || clause.clauseText || "").toLowerCase();
    const finding = findingForClause(report, clause.id);

    if (focus?.clauseId && clause.id === focus.clauseId) score += 40;
    if (focus?.findingId && finding?.id === focus.findingId) score += 40;

    if (targetSection && sectionNumberOf(clause) === targetSection) score += 30;

    for (const token of tokens) {
      if (/^\d+$/.test(token)) continue;
      if (wordHit(title, token)) score += 4;
      else if (wordHit(text, token)) score += (docFrequency.get(token) ?? 99) <= 2 ? 5 : 1;
      if (finding && wordHit(finding.title.toLowerCase(), token)) score += 2;
    }

    // Topic groups: the question is about e.g. "notice" and this clause is in that topic.
    const clauseGroup = CATEGORY_TO_GROUP[clause.category];
    if (clauseGroup && groups.has(clauseGroup)) score += 5;
    for (const group of groups) {
      const words = TOPIC_GROUPS[group];
      if (words.some((w) => wordHit(title, w))) score += 3;
      const textHits = words.filter((w) => wordHit(text, w)).length;
      score += Math.min(textHits, 3);
    }

    return { clause, score, finding, chain: chainForFinding(report, finding) };
  });

  return ranked.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
}

/** Minimum score for a clause to count as genuinely addressing the question. */
export const RELEVANCE_THRESHOLD = 5;

/**
 * Picks the sentence(s) in a clause that best answer the question, so a factual question
 * ("what is the notice period?") gets the actual operative sentence, not the clause's opening.
 */
export function bestSentences(clauseText: string, question: string, max = 2): string[] {
  const tokens = tokenize(question).filter((t) => !/^\d+$/.test(t));
  const groups = groupsForTokens(tokens);
  const sentences = splitSentences(clauseText);
  if (sentences.length <= max) return sentences;
  // A figure quoted in the question ("4,50,000") is the strongest signal of the operative sentence.
  const figures = (question.match(/\d[\d,]*(?:\.\d+)?/g) || []).filter((n) => n.replace(/\D/g, "").length >= 3);
  const scored = sentences.map((s, i) => {
    let score = 0;
    for (const t of tokens) if (wordHit(s, t)) score += 2;
    for (const g of groups) score += TOPIC_GROUPS[g].filter((w) => wordHit(s, w)).length;
    for (const f of figures) if (s.includes(f)) score += 6;
    return { s, i, score };
  });
  const top = scored.sort((a, b) => b.score - a.score || a.i - b.i).slice(0, max);
  return top.sort((a, b) => a.i - b.i).map((x) => x.s);
}

/** Question intents that are about the whole document rather than one clause. */
export function detectDocumentWideIntent(question: string): "overview" | "missing" | "actions" | "lawyer" | null {
  const q = question.toLowerCase();
  if (/\b(missing|absent|not (?:stated|mentioned|in the document)|unclear|information is needed)\b/.test(q)) return "missing";
  if (/\b(show|bring|take|prepare)\b.*\blawyer\b|\blawyer\b.*\b(show|bring|prepare)\b|\bformal review\b/.test(q)) return "lawyer";
  if (/what should i (?:ask|do|clarify|negotiate)|questions? (?:to|should i) (?:ask|clarify)|before signing|next steps?|how (?:do|can) i negotiate/.test(q)) return "actions";
  if (/\b(most important|critical|key terms?|biggest risks?|main risks?|overview|summar(?:y|ize)|what should i (?:worry|know)|red flags?)\b/.test(q)) return "overview";
  return null;
}
