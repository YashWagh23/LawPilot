import type {
  AnalysisReport,
  Clause,
  EvidenceChain,
  Finding,
  JurisdictionContext,
  LegalSource,
} from "@/types";
import type { AskConversationMessage } from "@/types/ask";
import { getReportJurisdiction } from "@/lib/jurisdiction/jurisdictionDetector";
import { chainForFinding, rankClauses, type QuestionFocus } from "./relevance";

export interface FilteredAskContext {
  relevantClauses: Clause[];
  relevantFindings: Finding[];
  relevantChains: EvidenceChain[];
  relevantSources: LegalSource[];
  jurisdiction: JurisdictionContext;
  documentTitle: string;
  sanitizedQuestion: string;
  conversationHistorySummary: string;
  untrustedContextXml: string;
}

/**
 * Protect against prompt injection attacks
 */
export function sanitizeUserQuestion(question: string): string {
  let sanitized = question
    .replace(/<[^>]*>/g, "") // Strip HTML/XML tags
    .replace(/```[\s\S]*?```/g, "") // Strip backtick code blocks
    .trim();

  if (sanitized.length > 1000) {
    sanitized = sanitized.slice(0, 1000);
  }

  return sanitized;
}

/**
 * Context Builder for Ask LawPilot
 * Selects minimum necessary context to prevent token bloat and ensure grounded answers.
 * Clauses are ranked against the question (and the user's selected clause/finding, which always
 * comes first) so the model is shown the clause the question is actually about.
 */
export function buildAskContext(
  report: AnalysisReport,
  question: string,
  history: AskConversationMessage[] = [],
  focus?: QuestionFocus
): FilteredAskContext {
  const sanitizedQuestion = sanitizeUserQuestion(question);

  // 1. Relevant clauses: ranked matches; else the highest-risk clauses as a last resort.
  const ranked = rankClauses(report, sanitizedQuestion, focus);
  let matchedClauses = ranked.slice(0, 4).map((r) => r.clause);

  if (matchedClauses.length === 0) {
    const importantIds = new Set(
      report.findings
        .filter((f) => f.severity === "critical_attention" || f.severity === "high_attention")
        .map((f) => f.clauseId)
        .filter(Boolean)
    );
    matchedClauses = report.clauses.filter((c) => importantIds.has(c.id)).slice(0, 4);
    if (matchedClauses.length === 0) matchedClauses = report.clauses.slice(0, 4);
  }

  const matchedClauseIds = new Set(matchedClauses.map((c) => c.id));

  // 2. Findings and 3. Evidence chains attached to those clauses
  let matchedFindings = report.findings.filter((f) => matchedClauseIds.has(f.clauseId) || (f.evidence?.clauseId && matchedClauseIds.has(f.evidence.clauseId)));
  if (matchedFindings.length === 0) matchedFindings = report.findings.slice(0, 3);
  matchedFindings = matchedFindings.slice(0, 4);

  const chainSet = new Map<string, EvidenceChain>();
  for (const f of matchedFindings) {
    const chain = chainForFinding(report, f);
    if (chain) chainSet.set(chain.id, chain);
  }
  const matchedChains = Array.from(chainSet.values()).slice(0, 3);

  // 4. Verified sources from matched chains
  const sourcesMap = new Map<string, LegalSource>();
  for (const chain of matchedChains) {
    for (const src of chain.legalSources || []) sourcesMap.set(src.id, src);
  }
  const relevantSources = Array.from(sourcesMap.values());

  // 5. Jurisdiction context: never defaults to a country the document did not establish
  const jurisdiction = getReportJurisdiction(report);
  const jurisdictionText =
    jurisdiction.country === "Unknown"
      ? "Not established by the document"
      : `${jurisdiction.country}${jurisdiction.stateOrUT ? ` (${jurisdiction.stateOrUT})` : ""}`;

  // 6. Format recent conversation history
  const recentHistory = history.slice(-4);
  const conversationHistorySummary = recentHistory.length > 0
    ? recentHistory
        .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 200)}`)
        .join("\n")
    : "No prior conversation.";

  // 7. Format untrusted document context with explicit boundaries
  const untrustedContextXml = `
<untrusted_document_context>
DOCUMENT METADATA:
- Title: ${report.metadata.title || "Legal Agreement"}
- Type: ${(report.metadata.documentType || "general_contract").replace(/_/g, " ")}
- Parties: ${(report.metadata.parties || []).map((p) => `${p.name} (${p.role})`).join(", ") || "Unspecified"}
- Governing Law: ${jurisdiction.governingLaw || "Not stated"}
- Jurisdiction: ${jurisdictionText}

KEY FINANCIAL TERMS:
${(report.financialTerms || []).map((t) => `- ${t.label}: ${t.formattedAmount}`).join("\n") || "None specified"}

KEY DATES & NOTICE PERIODS:
${(report.keyDates || []).map((d) => `- ${d.label}: ${d.description || (d.noticePeriodDays ? `${d.noticePeriodDays} days` : d.date || "Specified")} (Clause: ${d.clauseReference?.section || "N/A"})`).join("\n") || "None specified"}

RELEVANT CLAUSES (most relevant first):
${matchedClauses
  .map(
    (c) =>
      `[Clause ${c.section || c.sectionNumber || "N/A"}: ${c.title || c.category}] (Page ${c.pageNumber || 1}, ID: ${c.id})\n"${c.rawText || c.clauseText || ""}"`
  )
  .join("\n\n")}

RELEVANT FINDINGS:
${matchedFindings
  .map(
    (f) =>
      `[Finding: ${f.title}] Severity: ${f.severity} | Section: ${f.evidence?.section || f.clauseReference?.section || "N/A"}\nSummary: ${f.plainEnglishSummary || f.description}\nWhy It Matters: ${f.whyItMatters || "N/A"}`
  )
  .join("\n\n")}

VERIFIED LEGAL CONTEXT & EVIDENCE CHAINS:
${
  matchedChains.length > 0
    ? matchedChains
        .map(
          (ch) =>
            `[Evidence Chain: ${ch.finding?.title || "Legal Issue"}]\nLegal Claim: ${ch.legalClaims?.[0]?.claim || "N/A"}\nExplanation: ${ch.legalClaims?.[0]?.explanation || "N/A"}\nUncertainties: ${(ch.uncertainties || []).join("; ") || "None"}\nSources: ${(ch.legalSources || []).map((s: LegalSource) => `${s.citation} [id: ${s.id}]`).join("; ") || "NONE - no verified legal source is available for this issue"}`
        )
        .join("\n\n")
    : "NONE - no verified legal source is available for these clauses"
}
</untrusted_document_context>
`.trim();

  return {
    relevantClauses: matchedClauses,
    relevantFindings: matchedFindings,
    relevantChains: matchedChains,
    relevantSources,
    jurisdiction,
    documentTitle: report.metadata.title || "Legal Agreement",
    sanitizedQuestion,
    conversationHistorySummary,
    untrustedContextXml,
  };
}
