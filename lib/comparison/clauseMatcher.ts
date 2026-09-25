import type { Clause } from "@/types";

export interface MatchedClausePair {
  id: string;
  previousClause: Clause | null;
  currentClause: Clause | null;
  previousSection: string | null;
  currentSection: string | null;
  isSectionMoved: boolean;
  matchConfidence: "exact_title" | "semantic_high" | "semantic_medium" | "unmatched";
}

/**
 * Normalizes title string for robust semantic comparison
 */
export function normalizeClauseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(?:section|article|clause|paragraph)\s+[0-9ivx\-.]+\s*[:\-–—]?\s*/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts normalized word tokens from text
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Computes Jaccard similarity between two token sets
 */
export function computeTokenJaccard(tokensA: Set<string>, tokensB: Set<string>): number {
  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  });

  const unionSize = tokensA.size + tokensB.size - intersectionCount;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * Common legal concept synonym dictionary for matching clauses
 */
const CONCEPT_SYNONYMS: Record<string, string[]> = {
  notice: ["notice", "resignation", "departure", "exit", "advance notice"],
  training: ["training", "bond", "reimbursement", "clawback", "specialized training"],
  non_compete: ["non-compete", "non compete", "restrictive covenant", "competition", "restraint"],
  intellectual_property: ["intellectual property", "inventions", "ip", "proprietary", "copyright", "patent"],
  confidentiality: ["confidentiality", "confidential", "trade secret", "non-disclosure", "nda"],
  arbitration: ["arbitration", "dispute resolution", "arbitrator", "mediation", "tribunal"],
  termination: ["termination", "dismissal", "discharge", "severance", "cause"],
  compensation: ["compensation", "salary", "ctc", "remuneration", "benefits"],
  governing_law: ["governing law", "jurisdiction", "venue", "courts", "applicable law"],
  probation: ["probation", "probationary", "evaluation period", "confirmation"],
  remote_work: ["remote work", "work from home", "data security", "telecommuting"],
};

/**
 * Scores semantic affinity between two clauses based on title, category, and text tokens.
 *
 * Category and topic-synonym hints are only allowed to contribute when the clauses ALSO share
 * real textual/title overlap; otherwise two unrelated clauses that merely share a category
 * (e.g. "Rent" and "Security Deposit", both "payment") were being paired as the same clause.
 */
export function calculateClauseAffinity(a: Clause, b: Clause): number {
  const normTitleA = normalizeClauseTitle(a.title);
  const normTitleB = normalizeClauseTitle(b.title);

  // 0. Identical wording under a different title/number is the same clause.
  const normTextA = a.rawText.replace(/\s+/g, " ").trim().toLowerCase();
  const normTextB = b.rawText.replace(/\s+/g, " ").trim().toLowerCase();
  if (normTextA.length > 20 && normTextA === normTextB) {
    return 1.0;
  }

  // 1. Direct title match or substring inclusion
  if (normTitleA === normTitleB && normTitleA.length > 0) {
    return 1.0;
  }
  if (
    (normTitleA.includes(normTitleB) || normTitleB.includes(normTitleA)) &&
    Math.min(normTitleA.length, normTitleB.length) > 5
  ) {
    return 0.9;
  }

  const tokensA = tokenize(a.rawText);
  const tokensB = tokenize(b.rawText);
  const textJaccard = computeTokenJaccard(tokensA, tokensB);
  const titleJaccard = computeTokenJaccard(tokenize(normTitleA), tokenize(normTitleB));

  // 2. Keyword synonyms in titles (only counts with supporting overlap)
  let sharesConcept = false;
  for (const [, synonyms] of Object.entries(CONCEPT_SYNONYMS)) {
    const hasA = synonyms.some((s) => normTitleA.includes(s));
    const hasB = synonyms.some((s) => normTitleB.includes(s));
    if (hasA && hasB) {
      sharesConcept = true;
      break;
    }
  }
  const conceptMatchBonus = sharesConcept && (textJaccard >= 0.12 || titleJaccard >= 0.2) ? 0.45 : 0;

  // 3. Category match bonus (only with supporting overlap)
  const sameCategory = a.category === b.category && a.category !== "general" && a.category !== "other";
  const categoryBonus = sameCategory && (textJaccard >= 0.2 || titleJaccard >= 0.34) ? 0.3 : 0;

  // 4. Title token overlap
  const titleBonus = titleJaccard >= 0.5 ? 0.35 : titleJaccard >= 0.34 ? 0.2 : 0;

  return Math.min(1.0, textJaccard * 0.4 + conceptMatchBonus + categoryBonus + titleBonus);
}

/** Minimum affinity for two clauses to be treated as the same provision. */
const MATCH_THRESHOLD = 0.5;

/**
 * Matches clauses between previous and current versions semantically.
 * Handles section renumbering (e.g. Section 7 -> Section 9) without falsely
 * reporting them as removed and added.
 *
 * Assignment is global and best-first (highest-affinity pairs claim each other first), so the
 * result does not depend on clause order and one clause can never steal another's true partner.
 */
export function matchClausesSemantically(
  previousClauses: Clause[],
  currentClauses: Clause[]
): MatchedClausePair[] {
  const results: MatchedClausePair[] = [];
  const matchedCurrentIndices = new Set<number>();
  const matchedPreviousIndices = new Set<number>();
  const previousMatchMap = new Map<number, { currentIndex: number; score: number; confidence: MatchedClausePair["matchConfidence"] }>();

  const candidates: { i: number; j: number; score: number }[] = [];
  for (let i = 0; i < previousClauses.length; i++) {
    for (let j = 0; j < currentClauses.length; j++) {
      let score = calculateClauseAffinity(previousClauses[i], currentClauses[j]);
      // Tiny tie-breaker: identical section labels / similar position are more likely the same clause.
      if ((previousClauses[i].section || "").trim().toLowerCase() === (currentClauses[j].section || "").trim().toLowerCase()) score += 0.01;
      score -= Math.abs(i / Math.max(previousClauses.length, 1) - j / Math.max(currentClauses.length, 1)) * 0.01;
      if (score >= MATCH_THRESHOLD) candidates.push({ i, j, score });
    }
  }
  candidates.sort((x, y) => y.score - x.score || x.i - y.i || x.j - y.j);

  for (const { i, j, score } of candidates) {
    if (matchedPreviousIndices.has(i) || matchedCurrentIndices.has(j)) continue;
    let confidence: MatchedClausePair["matchConfidence"] = "semantic_medium";
    if (score >= 0.85) confidence = "exact_title";
    else if (score >= 0.6) confidence = "semantic_high";
    previousMatchMap.set(i, { currentIndex: j, score, confidence });
    matchedPreviousIndices.add(i);
    matchedCurrentIndices.add(j);
  }

  // Assemble matched previous clauses
  for (let i = 0; i < previousClauses.length; i++) {
    const prev = previousClauses[i];
    const match = previousMatchMap.get(i);

    if (match) {
      const curr = currentClauses[match.currentIndex];
      const prevSecNorm = (prev.section || "").trim().toLowerCase();
      const currSecNorm = (curr.section || "").trim().toLowerCase();
      const isSectionMoved = prevSecNorm !== currSecNorm && prevSecNorm !== "" && currSecNorm !== "";

      results.push({
        id: `match-${prev.id}-${curr.id}`,
        previousClause: prev,
        currentClause: curr,
        previousSection: prev.section || null,
        currentSection: curr.section || null,
        isSectionMoved,
        matchConfidence: match.confidence,
      });
    } else {
      // Unmatched previous clause -> REMOVED
      results.push({
        id: `removed-${prev.id}`,
        previousClause: prev,
        currentClause: null,
        previousSection: prev.section || null,
        currentSection: null,
        isSectionMoved: false,
        matchConfidence: "unmatched",
      });
    }
  }

  // Assemble unmatched current clauses -> ADDED
  for (let j = 0; j < currentClauses.length; j++) {
    if (!matchedCurrentIndices.has(j)) {
      const curr = currentClauses[j];
      results.push({
        id: `added-${curr.id}`,
        previousClause: null,
        currentClause: curr,
        previousSection: null,
        currentSection: curr.section || null,
        isSectionMoved: false,
        matchConfidence: "unmatched",
      });
    }
  }

  return results;
}
