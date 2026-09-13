import type {
  AnalysisReport,
  Clause,
  EvidenceChain,
  Finding,
  JurisdictionContext,
  LegalSource,
} from "@/types";
import type { AskConversationMessage } from "@/types/ask";

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
 * Normalizes text for keyword search
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

/**
 * Check if text contains any tokens from a query
 */
function matchesKeywords(text: string, queryTokens: string[]): boolean {
  const norm = normalize(text);
  return queryTokens.some((token) => token.length > 2 && norm.includes(token));
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
 * Selects minimum necessary context to prevent token bloat and ensure grounded answers
 */
export function buildAskContext(
  report: AnalysisReport,
  question: string,
  history: AskConversationMessage[] = []
): FilteredAskContext {
  const sanitizedQuestion = sanitizeUserQuestion(question);
  const queryTokens = normalize(sanitizedQuestion).split(/\s+/).filter(Boolean);

  // Check for section number patterns e.g. "section 8", "clause 5", "s. 4", "sec 2"
  const sectionMatch = sanitizedQuestion.match(/(?:section|clause|sec\.?|s\.?)\s*([0-9A-Za-z.-]+)/i);
  const targetSection = sectionMatch ? sectionMatch[1].toLowerCase() : null;

  // 1. Identify relevant clauses
  let matchedClauses = report.clauses.filter((c) => {
    const cSec = (c.section || c.sectionNumber || "").toLowerCase();
    const cTitle = (c.title || "").toLowerCase();
    const cText = (c.rawText || c.clauseText || "").slice(0, 200);

    if (targetSection) {
      if (cSec === targetSection || cSec.includes(targetSection) || cTitle.includes(`section ${targetSection}`)) {
        return true;
      }
    }
    return (
      matchesKeywords(cTitle, queryTokens) ||
      matchesKeywords(c.category || "", queryTokens) ||
      matchesKeywords(cText, queryTokens)
    );
  });

  // If no clauses matched directly, take top 4 highest-risk or representative clauses
  if (matchedClauses.length === 0) {
    const importantIds = new Set(
      report.findings
        .filter((f) => f.severity === "critical_attention" || f.severity === "high_attention")
        .map((f) => f.clauseId)
        .filter(Boolean)
    );
    matchedClauses = report.clauses.filter((c) => importantIds.has(c.id)).slice(0, 4);
    if (matchedClauses.length === 0) {
      matchedClauses = report.clauses.slice(0, 4);
    }
  } else if (matchedClauses.length > 5) {
    matchedClauses = matchedClauses.slice(0, 5);
  }

  const matchedClauseIds = new Set(matchedClauses.map((c) => c.id));

  // 2. Identify relevant findings
  let matchedFindings = report.findings.filter((f) => {
    if (f.clauseId && matchedClauseIds.has(f.clauseId)) return true;
    return (
      matchesKeywords(f.title, queryTokens) ||
      matchesKeywords(f.plainEnglishSummary || f.description, queryTokens) ||
      matchesKeywords(f.category, queryTokens)
    );
  });

  if (matchedFindings.length === 0) {
    matchedFindings = report.findings.slice(0, 3);
  } else if (matchedFindings.length > 4) {
    matchedFindings = matchedFindings.slice(0, 4);
  }

  // 3. Identify relevant Evidence Chains
  let matchedChains = (report.evidenceChains || []).filter((chain) => {
    const chainClauseId = chain.documentEvidence?.clauseId || chain.finding?.clauseId;
    if (chainClauseId && matchedClauseIds.has(chainClauseId)) return true;

    const findingTitle = chain.finding?.title || "";
    const legalClaim = chain.legalClaims?.[0]?.claim || "";
    const legalContext = chain.legalClaims?.[0]?.explanation || "";

    return (
      matchesKeywords(findingTitle, queryTokens) ||
      matchesKeywords(legalClaim, queryTokens) ||
      matchesKeywords(legalContext, queryTokens)
    );
  });

  if (matchedChains.length === 0 && (report.evidenceChains || []).length > 0) {
    matchedChains = (report.evidenceChains || []).slice(0, 2);
  } else if (matchedChains.length > 3) {
    matchedChains = matchedChains.slice(0, 3);
  }

  // 4. Extract verified sources from matched chains
  const sourcesMap = new Map<string, LegalSource>();
  for (const chain of matchedChains) {
    const chainSources = chain.legalSources || [];
    for (const src of chainSources) {
      sourcesMap.set(src.id, src);
    }
  }
  const relevantSources = Array.from(sourcesMap.values());

  // 5. Jurisdiction context
  const jurisdiction: JurisdictionContext =
    report.jurisdictionContext ||
    report.metadata.jurisdictionContext || {
      country: "India",
      stateOrUT: "Maharashtra",
      governingLaw: report.metadata.governingLaw || "Laws of the Republic of India",
      confidence: "high",
      source: "document",
    };

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
- Parties: ${(report.metadata.parties || []).map((p) => `${p.name} (${p.role})`).join(", ") || "Unspecified"}
- Governing Law: ${jurisdiction.governingLaw || "India"}
- Jurisdiction: ${jurisdiction.country}${jurisdiction.stateOrUT ? ` (${jurisdiction.stateOrUT})` : ""}

KEY FINANCIAL TERMS:
${(report.financialTerms || []).map((t) => `- ${t.label}: ${t.formattedAmount}`).join("\n") || "None specified"}

KEY DATES & NOTICE PERIODS:
${(report.keyDates || []).map((d) => `- ${d.label}: ${d.noticePeriodDays ? `${d.noticePeriodDays} days` : d.date || "Specified"} (Clause: ${d.clauseReference?.section || "N/A"})`).join("\n") || "None specified"}

RELEVANT CLAUSES:
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
${matchedChains
  .map(
    (ch) =>
      `[Evidence Chain: ${ch.finding?.title || "Legal Issue"}]\nLegal Claim: ${ch.legalClaims?.[0]?.claim || "N/A"}\nExplanation: ${ch.legalClaims?.[0]?.explanation || "N/A"}\nUncertainties: ${(ch.uncertainties || []).join("; ") || "None"}\nSources: ${(ch.legalSources || []).map((s: LegalSource) => s.citation).join("; ")}`
  )
  .join("\n\n")}
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
