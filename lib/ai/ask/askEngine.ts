import { z } from "zod";
import { generateJson, isGeminiConfigured } from "@/lib/ai/gemini";
import type { AnalysisReport, EvidenceChain, Finding, LegalSource } from "@/types";
import type {
  AskAnswerCitation,
  AskAnswerStructure,
  AskConversationMessage,
  AskQuestionType,
} from "@/types/ask";
import { ASK_LAWPILOT_SYSTEM_PROMPT } from "@/lib/ai/prompts/askPrompts";
import { buildAskContext, sanitizeUserQuestion } from "./contextBuilder";
import { classifyQuestion } from "./questionClassifier";
import {
  RELEVANCE_THRESHOLD,
  bestSentences,
  chainForFinding,
  detectDocumentWideIntent,
  rankClauses,
  type QuestionFocus,
  type RankedClause,
} from "./relevance";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";
import { getJurisdictionLabel } from "@/lib/jurisdiction/jurisdictionDetector";
import { extractDurations } from "@/lib/documents/measures";
import { findUngroundedCitations } from "@/lib/negotiation/negotiationEngine";

export interface AskEngineInput {
  report: AnalysisReport;
  question: string;
  history?: AskConversationMessage[];
  /** The clause or finding the user selected in the UI, if any. */
  focus?: QuestionFocus;
}

/**
 * Calibrates language to prevent overstatements of legal certainty
 */
function calibrateLanguage(text: string): string {
  return text
    .replace(/\bthis is illegal\b/gi, "this raises significant enforceability issues under statutory law")
    .replace(/\bthey cannot do this\b/gi, "statutory authorities generally restrict this practice")
    .replace(/\byou will definitely win\b/gi, "the established legal authorities strongly favor this position")
    .replace(/\byou should sue\b/gi, "you should consider seeking formal advice from a qualified attorney")
    .replace(/\bthis violates the law\b/gi, "this is subject to statutory restrictions under applicable law");
}

// ─── Text helpers ─────────────────────────────────────────────────────────

function truncateAtWord(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max)}…`;
}

function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function lowerFirst(s: string): string {
  return s.replace(/^./, (c) => c.toLowerCase());
}

function sectionLabel(clause: { section?: string; sectionNumber?: string }): string {
  return clause.section || clause.sectionNumber || "the relevant clause";
}

const DISCLAIMER_LINE = /provides legal information|not legal advice|licensed legal counsel/i;

function collectUncertainties(finding?: Finding, chain?: EvidenceChain): string[] {
  const all = [
    ...(finding?.uncertainties || []),
    ...(chain?.uncertainties || []),
    ...(chain?.uncertainty?.factualDependencies || []),
  ]
    .map((u) => u.trim())
    .filter((u) => u.length > 8 && !DISCLAIMER_LINE.test(u));
  const seen = new Set<string>();
  return all.filter((u) => {
    const k = normalizeWs(u);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function toFollowUpQuestion(uncertainty: string): string {
  const core = uncertainty.replace(/[.]+$/, "").trim();
  if (/^whether\s+/i.test(core)) return `Do you know ${lowerFirst(core)}?`;
  if (/^(?:the\s+)?(?:exact|actual)\b/i.test(core)) return `Can you find out ${lowerFirst(core)}?`;
  return `Can you confirm: ${lowerFirst(core)}?`;
}

function toWouldChange(uncertainty: string): string {
  const core = uncertainty.replace(/[.]+$/, "").trim();
  return `The answer could change depending on ${/^whether\s+/i.test(core) ? lowerFirst(core) : lowerFirst(core)}.`;
}

function legalContextFor(report: AnalysisReport, chain?: EvidenceChain): { text: string; sources: LegalSource[] } {
  const sources = (chain?.legalSources || []).slice(0, 3);
  const claims = chain?.legalClaims || [];
  const jurisdiction = getJurisdictionLabel(report);

  if (sources.length > 0 && claims.length > 0) {
    const claim = claims[0];
    const cites = sources.map((s) => s.citation).join("; ");
    return { text: `${claim.claim} ${claim.explanation && claim.explanation !== claim.claim ? claim.explanation + " " : ""}(Verified sources: ${cites}.)`.replace(/\s+/g, " ").trim(), sources };
  }
  if (sources.length > 0) {
    return { text: `Relevant verified authority: ${sources.map((s) => `${s.title} (${s.citation})`).join("; ")}.`, sources };
  }
  return {
    text:
      jurisdiction === "Unknown jurisdiction"
        ? "LawPilot could not establish which law governs this document, and has no verified legal source linked to this issue. A lawyer should confirm the governing law before relying on any view of enforceability."
        : `LawPilot has no verified legal source linked to this issue for ${jurisdiction}, so it cannot state how the law treats it. A lawyer qualified in that jurisdiction should confirm.`,
    sources: [],
  };
}

function clauseCitation(r: RankedClause, quote: string, idx = 1): AskAnswerCitation {
  return {
    id: `cit-clause-${r.clause.id}-${idx}`,
    type: "document_clause",
    clauseId: r.clause.id,
    clauseTitle: r.clause.title,
    sectionNumber: r.clause.sectionNumber || r.clause.section,
    pageNumber: r.clause.pageNumber,
    exactQuote: truncateAtWord(quote, 200),
  };
}

function sourceCitations(sources: LegalSource[]): AskAnswerCitation[] {
  return sources.map((s) => ({
    id: `cit-src-${s.id}`,
    type: "legal_source" as const,
    sourceId: s.id,
    sourceTitle: s.title,
    citation: s.citation,
    url: s.url,
    jurisdiction: s.jurisdiction,
    verificationStatus: s.verificationStatus,
  }));
}

function baseAnswer(
  question: string,
  classification: AskQuestionType,
  partial: Partial<AskAnswerStructure> & Pick<AskAnswerStructure, "answer">
): AskAnswerStructure {
  return {
    id: `ask-ans-${Date.now()}`,
    question,
    classification,
    sources: [],
    citations: [],
    confidence: "moderate",
    isOutOfScope: false,
    isLiveAi: false,
    disclaimer: GLOBAL_LEGAL_DISCLAIMER,
    ...partial,
  };
}

const SEVERITY_ORDER: Record<string, number> = {
  critical_attention: 0,
  high_attention: 1,
  review: 2,
  context_dependent: 3,
  informational: 4,
};

function findingsBySeverity(report: AnalysisReport): Finding[] {
  return [...report.findings].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5));
}

// ─── Deterministic grounded answer ────────────────────────────────────────

/**
 * Builds an answer ONLY from the analyzed report: the clause the question is about (ranked from
 * the question, or the clause/finding the user selected), its finding, its evidence chain, and the
 * action plan. It never contains text that is not derived from the report, and it says plainly
 * when the document does not appear to address the question.
 */
export function generateDeterministicGroundedAnswer(
  report: AnalysisReport,
  question: string,
  classification: AskQuestionType,
  focus?: QuestionFocus
): AskAnswerStructure {
  const jurisdiction = getJurisdictionLabel(report);
  const wide = focus?.clauseId || focus?.findingId ? null : detectDocumentWideIntent(question);

  // ── Document-wide questions ──────────────────────────────────────────
  if (wide === "missing") {
    const gaps = Array.from(
      new Set([
        ...(report.lawyerBrief?.missingInformation || []),
        ...report.findings.flatMap((f) => f.uncertainties || []),
        ...(!report.metadata.effectiveDate ? ["The agreement's effective date was not identified in the document."] : []),
        ...((report.metadata.parties || []).length < 2 ? ["The parties to the agreement could not be reliably identified."] : []),
        ...(report.jurisdictionContext?.country === "Unknown" ? ["The governing law is not clearly stated in the document."] : []),
      ].filter((g) => g && !DISCLAIMER_LINE.test(g)))
    ).slice(0, 6);
    return baseAnswer(question, "MISSING_INFORMATION", {
      answer: gaps.length
        ? `Based on this analysis, ${gaps.length} point${gaps.length === 1 ? " is" : "s are"} absent or unclear in the document itself. The main ones are listed below.`
        : "The analysis did not identify significant missing information, though a lawyer may still spot gaps.",
      whatDocumentSays: `${report.clauses.length} clauses were analyzed in "${report.metadata.title}".`,
      legalContext: `Jurisdiction: ${jurisdiction}.`,
      whatIsUncertain: gaps.map((g, i) => `${i + 1}. ${g}`).join("\n") || undefined,
      whatWouldChangeAnswer: gaps.slice(0, 3).map(toWouldChange),
      followUpQuestions: gaps.slice(0, 3).map(toFollowUpQuestion),
      whatToDoNext: "Ask the other party for any missing documents or definitions in writing, and note the answers before signing.",
      confidence: "moderate",
    });
  }

  if (wide === "actions" || wide === "lawyer") {
    const plan = report.actionPlan;
    const items = [...(plan?.urgentItems || []), ...(plan?.beforeSigning || []), ...(plan?.questionsToAsk || [])];
    const top = findingsBySeverity(report).slice(0, 3);
    const steps = items.slice(0, 4).map((i, n) => `${n + 1}. ${i.title}${i.practicalAdvice ? ` — ${truncateAtWord(i.practicalAdvice, 160)}` : ""}`);
    const fallbackSteps = top.map((f, n) => `${n + 1}. Ask about ${f.evidence?.section || "the relevant clause"}: ${f.title}`);
    const uncertainties = top.flatMap((f) => collectUncertainties(f, chainForFinding(report, f))).slice(0, 3);
    return baseAnswer(question, "ACTION_NEXT_STEP", {
      answer:
        wide === "lawyer"
          ? `Bring the ${top.length} highest-priority issues to a lawyer: ${top.map((f) => `${f.title} (${f.evidence?.section || "clause"})`).join("; ") || "none were flagged"}. The "Prepare for a Lawyer" brief collects them with the clause text.`
          : `Here are practical, reversible steps drawn from this analysis:\n${(steps.length ? steps : fallbackSteps).join("\n") || "No specific steps were generated."}`,
      whatDocumentSays: top[0]?.evidence?.quotedText ? `${top[0].evidence.section}: "${truncateAtWord(top[0].evidence.quotedText, 240)}"` : undefined,
      legalContext: "Negotiating or clarifying terms in writing before signing is a low-risk, reversible step.",
      whatIsUncertain: uncertainties.join(" ") || "How flexible the other party is on these terms is not stated in the document.",
      whatWouldChangeAnswer: uncertainties.map(toWouldChange),
      followUpQuestions: uncertainties.map(toFollowUpQuestion).slice(0, 3),
      whatToDoNext: "Ask the other party to clarify these points in writing, then open the Next Steps tab to save them to your action plan.",
      confidence: "moderate",
    });
  }

  if (wide === "overview") {
    const top = findingsBySeverity(report).slice(0, 4);
    const uncertainties = top.flatMap((f) => collectUncertainties(f, chainForFinding(report, f))).slice(0, 3);
    return baseAnswer(question, "RISK_INTERPRETATION", {
      answer: top.length
        ? `The most important areas in "${report.metadata.title}" are: ${top.map((f) => `${f.title} (${f.evidence?.section || "clause"})`).join("; ")}.`
        : `LawPilot did not flag any clause as needing special attention in this ${report.metadata.documentType.replace(/_/g, " ")}.`,
      whatDocumentSays: top[0]?.evidence?.quotedText ? `${top[0].evidence.section}: "${truncateAtWord(top[0].evidence.quotedText, 240)}"` : undefined,
      legalContext: top[0] ? legalContextFor(report, chainForFinding(report, top[0])).text : `Jurisdiction: ${jurisdiction}.`,
      whatIsUncertain: uncertainties.join(" ") || undefined,
      whatWouldChangeAnswer: uncertainties.map(toWouldChange),
      followUpQuestions: uncertainties.map(toFollowUpQuestion).slice(0, 3),
      whatToDoNext: "Open the flagged items on the Overview tab to see each clause in the document.",
      confidence: top.length ? "moderate" : "limited",
    });
  }

  // ── Clause-specific questions ────────────────────────────────────────
  const ranked = rankClauses(report, question, focus);
  const top = ranked[0];

  if (!top || top.score < RELEVANCE_THRESHOLD) {
    const closest = ranked.slice(0, 2);
    const flagged = findingsBySeverity(report).slice(0, 2);
    return baseAnswer(question, classification, {
      answer: `I couldn't find a clause in this document that clearly addresses that question, so I can't answer it from the agreement.${
        closest.length ? ` The closest provisions are ${closest.map((c) => `${sectionLabel(c.clause)} (${c.clause.title})`).join(" and ")}.` : ""
      }`,
      whatDocumentSays: closest[0]
        ? `${sectionLabel(closest[0].clause)}: "${truncateAtWord(closest[0].clause.rawText, 220)}"`
        : undefined,
      legalContext: `No verified legal source can be linked without a matching clause. Jurisdiction: ${jurisdiction}.`,
      whatIsUncertain: "Whether the document addresses this topic elsewhere or in different wording, or leaves it unstated.",
      whatWouldChangeAnswer: ["If a specific section covers this topic, naming it will let LawPilot answer from that clause."],
      followUpQuestions: [
        "Which section do you think covers this?",
        ...(flagged[0] ? [`Would you like to ask about ${flagged[0].title} (${flagged[0].evidence?.section || "clause"}) instead?`] : []),
      ],
      whatToDoNext: "If this matters to your decision, ask the other party to confirm the point in writing before signing.",
      citations: closest[0] ? [clauseCitation(closest[0], closest[0].clause.rawText)] : [],
      confidence: "insufficient",
    });
  }

  const { clause, finding, chain } = top;
  const sec = sectionLabel(clause);
  const sentences = bestSentences(clause.rawText || clause.clauseText || "", question, 2);
  const quote = sentences.join(" ") || truncateAtWord(clause.rawText, 300);
  const legal = legalContextFor(report, chain);
  const uncertainties = collectUncertainties(finding, chain);
  const plain = clause.plainEnglish || clause.plainEnglishSummary || "";

  const durations = extractDurations(quote);
  const durationNote =
    classification === "DOCUMENT_FACT" && durations.length > 0
      ? ` Stated period: ${durations.slice(0, 2).map((d) => d.raw).join("; ")}.`
      : "";

  // The evidence chain's own calibrated legal claim, when a verified source backs it.
  const claimLead = legal.sources.length > 0 ? chain?.legalClaims?.[0]?.claim?.replace(/\s+/g, " ").trim() : undefined;

  let answer: string;
  switch (classification) {
    case "RISK_INTERPRETATION":
      answer = finding
        ? `LawPilot flagged ${sec} (${clause.title}) because ${lowerFirst(finding.whyItMatters || finding.description)}${claimLead ? ` ${claimLead}` : ""}`
        : `LawPilot did not flag ${sec} (${clause.title}) as a risk. ${plain}`;
      break;
    case "LEGAL_CONTEXT":
      answer = `${finding ? `${finding.description} ` : `${plain} `}${claimLead ? `${claimLead} ` : ""}${legal.sources.length ? "Verified legal context is below." : "No verified legal source is linked to this issue, so this is what the document itself says."}`;
      break;
    case "CLAUSE_EXPLANATION":
      answer = `${sec} (${clause.title}) ${plain ? `means, in plain English: ${lowerFirst(plain)}` : `states: "${truncateAtWord(quote, 260)}"`}`;
      break;
    default:
      answer = `${sec} (${clause.title}) states: "${truncateAtWord(quote, 320)}"${durationNote}${plain && plain.length < 240 ? ` In plain English: ${lowerFirst(plain)}` : ""}`;
  }

  const nextFromChain = chain?.nextSteps?.[0]?.practicalAdvice || chain?.practicalNextStep?.practicalAdvice;
  const nextFromPlan = (report.actionPlan?.beforeSigning || report.actionPlan?.questionsToAsk || []).find(
    (i) => finding && i.findingId === finding.id
  )?.practicalAdvice;

  return baseAnswer(question, classification, {
    answer: answer.replace(/\s+/g, " ").trim(),
    whatDocumentSays: `${sec}: "${truncateAtWord(quote, 400)}"`,
    legalContext: legal.text,
    whatIsUncertain: uncertainties.slice(0, 3).join(" ") || "Facts outside the written agreement (how the term is applied in practice) are not stated in the document.",
    whatWouldChangeAnswer: uncertainties.slice(0, 3).map(toWouldChange),
    followUpQuestions: uncertainties.slice(0, 3).map(toFollowUpQuestion),
    whatToDoNext:
      nextFromChain ||
      nextFromPlan ||
      `Ask the other party to clarify ${sec} in writing before you rely on it, and note their reply.`,
    sources: legal.sources,
    citations: [clauseCitation(top, quote), ...sourceCitations(legal.sources)],
    confidence: legal.sources.length > 0 ? "moderate" : "limited",
  });
}

// ─── Live AI answer ───────────────────────────────────────────────────────

const LiveAskSchema = z.object({
  classification: z
    .enum(["DOCUMENT_FACT", "CLAUSE_EXPLANATION", "LEGAL_CONTEXT", "RISK_INTERPRETATION", "ACTION_NEXT_STEP", "MISSING_INFORMATION", "OUT_OF_SCOPE"])
    .nullish()
    .catch(null),
  answer: z.string().min(10),
  whatDocumentSays: z.string().nullish().catch(null),
  legalContext: z.string().nullish().catch(null),
  whatIsUncertain: z.string().nullish().catch(null),
  whatWouldChangeAnswer: z.array(z.string()).catch([]),
  followUpQuestions: z.array(z.string()).catch([]),
  whatToDoNext: z.string().nullish().catch(null),
  citedClauseSections: z.array(z.string()).catch([]),
  citedLegalSourceIds: z.array(z.string()).catch([]),
  confidence: z.enum(["high", "moderate", "limited", "insufficient", "low"]).catch("moderate"),
  isOutOfScope: z.boolean().catch(false),
});

function buildLivePrompt(
  context: ReturnType<typeof buildAskContext>,
  classificationType: AskQuestionType,
  focus?: QuestionFocus
): string {
  return `
${ASK_LAWPILOT_SYSTEM_PROMPT}

ADDITIONAL RULES FOR THIS ANSWER:
- Answer the SPECIFIC question asked, using the clause(s) most relevant to it. Do not answer about a different topic.
- If the provided document context does not address the question, say so plainly instead of guessing.
- Only cite legal authorities that appear in the "VERIFIED LEGAL CONTEXT" section. If none appear, say no verified legal source is available; do not use outside legal knowledge.
- Always fill whatIsUncertain, whatWouldChangeAnswer (1-3 items) and followUpQuestions (1-3 items).
${focus?.clauseId || focus?.findingId ? "- The user selected a specific clause/finding; the first clause and finding below are that selection.\n" : ""}
CONVERSATION RECENT HISTORY:
${context.conversationHistorySummary}

QUESTION CLASSIFICATION HINT:
Category: ${classificationType}

USER QUESTION:
"${context.sanitizedQuestion}"

${context.untrustedContextXml}

Respond ONLY in valid JSON matching this exact structure:
{
  "classification": "${classificationType}",
  "answer": "Plain-English answer directly answering the question",
  "whatDocumentSays": "Verbatim quote and section from the document",
  "legalContext": "Verified legal information from the evidence chains, or a statement that none is available",
  "whatIsUncertain": "Facts or legal questions that cannot be determined",
  "whatWouldChangeAnswer": ["Contingent fact 1", "Contingent fact 2"],
  "followUpQuestions": ["Max 3 high-value questions"],
  "whatToDoNext": "Safe, practical, and reversible preparation step",
  "citedClauseSections": ["section numbers e.g. 5, 8"],
  "citedLegalSourceIds": ["source ids"],
  "confidence": "high" | "moderate" | "limited" | "insufficient",
  "isOutOfScope": false
}
`.trim();
}

/**
 * Primary Ask LawPilot Engine
 * Orchestrates grounded question answering with Gemini and fallback intelligence
 */
export async function askLawPilot(input: AskEngineInput): Promise<AskAnswerStructure> {
  const { report, question, history = [], focus } = input;
  const sanitizedQuestion = sanitizeUserQuestion(question);

  // 1. Classify the question
  const classificationResult = classifyQuestion(sanitizedQuestion);

  // 2. Handle OUT_OF_SCOPE inquiries immediately
  if (classificationResult.isOutOfScope) {
    return {
      id: `ask-ans-oos-${Date.now()}`,
      question: sanitizedQuestion,
      classification: "OUT_OF_SCOPE",
      answer:
        classificationResult.politeRedirection ||
        "I am LawPilot, specialized exclusively in analyzing legal documents and rights. I cannot answer unrelated questions. Please ask about your contract clauses, obligations, or next steps.",
      sources: [],
      citations: [],
      confidence: "high",
      isOutOfScope: true,
      isLiveAi: false,
      disclaimer: GLOBAL_LEGAL_DISCLAIMER,
    };
  }

  // The deterministic answer is always computed: it is the grounded fallback AND the source of
  // any field (uncertainty, follow-ups, verbatim quote, citations) the live model leaves out.
  const grounded = generateDeterministicGroundedAnswer(report, sanitizedQuestion, classificationResult.type, focus);

  if (!isGeminiConfigured()) return grounded;

  // 3. Build token-efficient, filtered context with prompt-injection defense
  const context = buildAskContext(report, sanitizedQuestion, history, focus);

  const result = await generateJson({
    label: "ask",
    contents: buildLivePrompt(context, classificationResult.type, focus),
    schema: LiveAskSchema,
    temperature: 0.2,
    maxOutputTokens: 4096,
    totalTimeoutMs: 25_000,
    attemptTimeoutMs: 18_000,
  });

  if (!result.ok) return grounded;
  const parsed = result.data;

  // A grounded "not addressed" verdict is authoritative: do not let the model invent an answer.
  if (grounded.confidence === "insufficient") return grounded;

  const allReportSources = (report.evidenceChains || []).flatMap((ch) => ch.legalSources || []);
  const allowedForCitationCheck = (context.relevantSources.length ? context.relevantSources : allReportSources).map((s) => ({
    citation: s.citation,
    title: s.title,
  }));

  // Legal context must not introduce authority that is not in the evidence chains.
  const legalText = parsed.legalContext ? calibrateLanguage(parsed.legalContext) : undefined;
  const legalViolations = legalText ? findUngroundedCitations(`${legalText} ${parsed.answer}`, allowedForCitationCheck as never) : [];
  const legalContext = legalViolations.length === 0 && legalText ? legalText : grounded.legalContext;

  // The quoted document text must really be in the report; otherwise use the verbatim quote.
  const quoteOk = (q?: string | null) => {
    if (!q) return false;
    const stripped = normalizeWs(q.replace(/^[^"“]*["“]/, "").replace(/["”][^"”]*$/, ""));
    return stripped.length > 12 && report.clauses.some((c) => normalizeWs(c.rawText || "").includes(stripped.slice(0, 80)));
  };

  const citations: AskAnswerCitation[] = [...grounded.citations.filter((c) => c.type === "document_clause")];
  const sources: LegalSource[] = [];
  for (const sId of parsed.citedLegalSourceIds) {
    const found = allReportSources.find((s) => s.id === sId || s.citation === sId);
    if (found && !sources.some((s) => s.id === found.id)) sources.push(found);
  }
  const finalSources = sources.length > 0 ? sources : grounded.sources;
  citations.push(...sourceCitations(finalSources));

  return {
    id: `ask-ans-${Date.now()}`,
    question: sanitizedQuestion,
    classification: parsed.classification ?? classificationResult.type,
    answer: calibrateLanguage(parsed.answer),
    whatDocumentSays: quoteOk(parsed.whatDocumentSays) ? calibrateLanguage(parsed.whatDocumentSays as string) : grounded.whatDocumentSays,
    legalContext,
    whatIsUncertain: parsed.whatIsUncertain ? calibrateLanguage(parsed.whatIsUncertain) : grounded.whatIsUncertain,
    whatWouldChangeAnswer: parsed.whatWouldChangeAnswer.length > 0 ? parsed.whatWouldChangeAnswer.slice(0, 3).map(calibrateLanguage) : grounded.whatWouldChangeAnswer,
    followUpQuestions: (parsed.followUpQuestions.length > 0 ? parsed.followUpQuestions : grounded.followUpQuestions || []).slice(0, 3).map(calibrateLanguage),
    whatToDoNext: parsed.whatToDoNext ? calibrateLanguage(parsed.whatToDoNext) : grounded.whatToDoNext,
    sources: finalSources,
    citations,
    confidence: parsed.confidence,
    isOutOfScope: parsed.isOutOfScope,
    isLiveAi: true,
    disclaimer: GLOBAL_LEGAL_DISCLAIMER,
  };
}
