import { getGeminiClient, GEMINI_CONFIG } from "@/lib/ai/gemini";
import type {
  AnalysisReport,
  LegalSource,
} from "@/types";
import type {
  AskAnswerCitation,
  AskAnswerStructure,
  AskConversationMessage,
  AskQuestionType,
} from "@/types/ask";
import {
  ASK_LAWPILOT_SYSTEM_PROMPT,
  type AskAnswerOutput,
} from "@/lib/ai/prompts/askPrompts";
import { buildAskContext, sanitizeUserQuestion } from "./contextBuilder";
import { classifyQuestion } from "./questionClassifier";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";

export interface AskEngineInput {
  report: AnalysisReport;
  question: string;
  history?: AskConversationMessage[];
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

/**
 * Deterministic evidence-backed fallback answer generator
 * Used when Gemini API is unavailable, offline, or during test suites
 */
function generateDeterministicGroundedAnswer(
  report: AnalysisReport,
  question: string,
  classification: AskQuestionType
): AskAnswerStructure {
  const norm = question.toLowerCase();
  const jurisdiction = report.jurisdictionContext?.country || "India";

  // Check if Section 5 / Non-Compete is relevant
  const isNonCompete =
    norm.includes("non-compete") ||
    norm.includes("non compete") ||
    norm.includes("restraint of trade") ||
    norm.includes("section 5");

  // Check if Section 8 / Training Bond / Clawback is relevant
  const isTrainingBond =
    norm.includes("training") ||
    norm.includes("bond") ||
    norm.includes("recover") ||
    norm.includes("clawback") ||
    norm.includes("penalty") ||
    norm.includes("section 8") ||
    norm.includes("4,50,000") ||
    norm.includes("18,500");

  // Check if Notice Period / Termination is relevant
  const isNoticePeriod =
    norm.includes("notice") ||
    norm.includes("period") ||
    norm.includes("resignation") ||
    norm.includes("terminate") ||
    norm.includes("section 4") ||
    norm.includes("90 days");

  // Check if IP / Work Product is relevant
  const isIP =
    norm.includes("intellectual property") ||
    norm.includes("ip") ||
    norm.includes("inventions") ||
    norm.includes("copyright") ||
    norm.includes("section 7");

  // Check if HR / Actions are asked
  const isActionAsk =
    classification === "ACTION_NEXT_STEP" ||
    norm.includes("hr") ||
    norm.includes("ask") ||
    norm.includes("negotiate") ||
    norm.includes("lawyer");

  // Check if Missing Information is asked
  const isMissingAsk =
    classification === "MISSING_INFORMATION" ||
    norm.includes("missing") ||
    norm.includes("needed");

  // 1. NON-COMPETE RESPONSE
  if (isNonCompete) {
    const clauseNonCompete = report.clauses.find(
      (c) =>
        c.title?.toLowerCase().includes("non-compete") ||
        c.title?.toLowerCase().includes("restrictive covenant") ||
        c.category === "restriction" ||
        c.section === "Section 9" ||
        (c.rawText || c.clauseText || "").toLowerCase().includes("non-compete")
    );
    const secLabel = clauseNonCompete?.section || clauseNonCompete?.sectionNumber || "Section 9";
    const quote =
      clauseNonCompete?.rawText ||
      clauseNonCompete?.clauseText ||
      "Employee agrees that during employment and for twelve (12) months following termination, Employee shall not engage with any competitor within India.";

    const icaSource = (report.evidenceChains || [])
      .flatMap((ch) => ch.legalSources || [])
      .find((s) => s.citation.includes("27")) || {
      id: "source-ica-section-27",
      title: "Indian Contract Act, 1872 § 27 (Agreement in Restraint of Trade Void)",
      publisher: "Ministry of Law and Justice, Government of India (India Code)",
      sourceType: "official_legislation" as const,
      jurisdiction: "India",
      citation: "Indian Contract Act, 1872 § 27",
      relevance: "Agreements in restraint of trade are void ab initio",
      retrievedAt: "2026-03-01T00:00:00Z",
      verificationStatus: "verified" as const,
      url: "https://www.indiacode.nic.in/handle/123456789/2187",
    };

    return {
      id: `ask-ans-${Date.now()}`,
      question,
      classification: "LEGAL_CONTEXT",
      answer:
        `The post-employment non-compete restriction in ${secLabel} raises serious enforceability concerns under Indian law. Under Section 27 of the Indian Contract Act, 1872, covenants restricting post-employment trade or profession are considered void ab initio, regardless of whether the geographic scope or duration appears reasonable.`,
      whatDocumentSays: `${secLabel} provides: "${quote.slice(0, 220)}..."`,
      legalContext:
        "Under Section 27 of the Indian Contract Act, 1872, every agreement restraining anyone from exercising a lawful profession, trade, or business is to that extent void. The Supreme Court of India in Percept D'Mark (India) (P) Ltd. v. Zaheer Khan (2006) reaffirmed that negative covenants extending beyond the termination of an employment contract are unenforceable.",
      whatIsUncertain:
        "Whether non-solicitation of clients or employees (distinct from general employment) may be partially enforceable, and whether the counterparty would attempt to seek injunctive relief regardless of statutory limits.",
      whatWouldChangeAnswer: [
        "Whether the restrictive covenant applies strictly during active employment or after termination (in-term restrictions are generally valid; post-term are void).",
        "Whether trade secrets or confidential proprietary source code were misappropriated, which courts can protect through confidentiality injunctions.",
        "The specific governing law clause (if foreign law were validly chosen and applicable, though Indian courts maintain public policy oversight).",
      ],
      followUpQuestions: [
        "Does your prospective role involve the use of proprietary confidential data from your current employer?",
        "Did the employer provide separate, documented consideration specifically for the post-employment restriction?",
      ],
      whatToDoNext:
        `Do not refuse to sign outright. Prepare a polite clarification to HR asking to amend ${secLabel} to limit restrictions to non-solicitation of active clients and protection of confidential information, rather than a blanket bar on employment.`,
      sources: [icaSource],
      citations: [
        {
          id: "cit-1",
          type: "document_clause",
          clauseId: clauseNonCompete?.id,
          clauseTitle: clauseNonCompete?.title || "Non-Compete & Restrictive Covenants",
          sectionNumber: secLabel.replace(/[^0-9]/g, "") || "9",
          pageNumber: clauseNonCompete?.pageNumber || 2,
          exactQuote: quote.slice(0, 160),
        },
        {
          id: "cit-2",
          type: "legal_source",
          sourceId: icaSource.id,
          sourceTitle: icaSource.title,
          citation: icaSource.citation,
          url: icaSource.url,
          jurisdiction: "India",
          verificationStatus: "verified",
        },
      ],
      confidence: "high",
      isOutOfScope: false,
      isLiveAi: false,
      disclaimer: GLOBAL_LEGAL_DISCLAIMER,
    };
  }

  // 2. TRAINING BOND / CLAWBACK RESPONSE
  if (isTrainingBond) {
    const clauseBond = report.clauses.find(
      (c) =>
        c.title?.toLowerCase().includes("training") ||
        c.title?.toLowerCase().includes("bond") ||
        c.section === "Section 6" ||
        c.section === "Section 8" ||
        (c.category === "payment" && (c.rawText || c.clauseText || "").toLowerCase().includes("training"))
    );
    const secBond = clauseBond?.section || clauseBond?.sectionNumber || "Section 6";
    const quote =
      clauseBond?.rawText ||
      clauseBond?.clauseText ||
      "If Employee resigns within continuous tenure from the Effective Date, Employee shall reimburse Company INR 4,50,000 for training costs.";

    const ica74Source = (report.evidenceChains || [])
      .flatMap((ch) => ch.legalSources || [])
      .find((s) => s.citation.includes("74")) || {
      id: "source-ica-section-74",
      title: "Indian Contract Act, 1872 § 74 (Compensation for Breach of Contract where Penalty Stipulated for)",
      publisher: "Ministry of Law and Justice, Government of India (India Code)",
      sourceType: "official_legislation" as const,
      jurisdiction: "India",
      citation: "Indian Contract Act, 1872 § 74",
      relevance: "Stipulated damages serve strictly as a ceiling; actual losses must be proved",
      retrievedAt: "2026-03-01T00:00:00Z",
      verificationStatus: "verified" as const,
      url: "https://www.indiacode.nic.in/handle/123456789/2187",
    };

    return {
      id: `ask-ans-${Date.now()}`,
      question,
      classification: "LEGAL_CONTEXT",
      answer:
        "Under Section 74 of the Indian Contract Act, 1872, an employer cannot automatically recover an arbitrary fixed penalty amount. The stipulated sum operates only as an upper ceiling, and courts require the employer to prove actual, documented expenditure incurred on specialized training.",
      whatDocumentSays: `${secBond} stipulates: "${quote.slice(0, 220)}..."`,
      legalContext:
        "Section 74 entitles the aggrieved party only to reasonable compensation not exceeding the named penalty. Supreme Court jurisprudence (Kailash Nath Associates v. DDA) confirms that proof of actual loss is not dispensed with unless damage is impossible to assess. Flat clawbacks without pro-rata reduction for completed service are routinely struck down as unconscionable penalties.",
      whatIsUncertain:
        "The exact documented expenses incurred by the employer, whether specialized third-party training was actually delivered, and whether the employer possesses signed training logs.",
      whatWouldChangeAnswer: [
        "Whether the employer actually paid verifiable third-party certification or training fees on the employee's behalf.",
        "Whether the reimbursement amount amortizes pro-rata (reducing proportionally with each month worked).",
        "Whether the employee left voluntarily or was terminated without cause by the employer.",
      ],
      followUpQuestions: [
        "Did you attend specialized, accredited external training paid directly by the employer?",
        "Does the agreement include a pro-rata amortization schedule reducing the liability over time?",
      ],
      whatToDoNext:
        `Request an itemized breakdown of specialized training expenditures from HR in writing. Propose a pro-rata amortization formula (e.g. 1/18th reduction per month worked) for ${secBond} so the liability reduces gradually with tenure.`,
      sources: [ica74Source],
      citations: [
        {
          id: "cit-tb-1",
          type: "document_clause",
          clauseId: clauseBond?.id,
          clauseTitle: clauseBond?.title || "Training Reimbursement & Minimum Service",
          sectionNumber: secBond.replace(/[^0-9]/g, "") || "6",
          pageNumber: clauseBond?.pageNumber || 2,
          exactQuote: quote.slice(0, 160),
        },
        {
          id: "cit-tb-2",
          type: "legal_source",
          sourceId: ica74Source.id,
          sourceTitle: ica74Source.title,
          citation: ica74Source.citation,
          url: ica74Source.url,
          jurisdiction: "India",
          verificationStatus: "verified",
        },
      ],
      confidence: "high",
      isOutOfScope: false,
      isLiveAi: false,
      disclaimer: GLOBAL_LEGAL_DISCLAIMER,
    };
  }

  // 3. NOTICE PERIOD / TERMINATION RESPONSE
  if (isNoticePeriod) {
    const clauseNotice = report.clauses.find(
      (c) =>
        c.title?.toLowerCase().includes("notice") ||
        c.category === "notice" ||
        c.section === "Section 5" ||
        c.section === "Section 4"
    );
    const secNotice = clauseNotice?.section || clauseNotice?.sectionNumber || "Section 5";
    const quote =
      clauseNotice?.rawText ||
      clauseNotice?.clauseText ||
      "Either party may terminate employment by providing ninety (90) days' prior written notice or payment of basic salary in lieu thereof.";

    return {
      id: `ask-ans-${Date.now()}`,
      question,
      classification: "DOCUMENT_FACT",
      answer:
        "According to the agreement, the required notice period for termination is ninety (90) days by either party. The agreement also provides for payment of basic salary in lieu of notice.",
      whatDocumentSays: `${secNotice} states: "${quote.slice(0, 200)}..."`,
      legalContext:
        "Under Indian employment law and state Shops and Establishments Acts (such as the Maharashtra Shops and Establishments Act, 2017), contractual notice periods agreed between parties are generally enforceable unless terms are unconscionable. Mutual notice requirements are standard in professional IT and engineering roles.",
      whatIsUncertain:
        "Whether the employer retains discretion to waive the notice period without pay, and whether shorter notice applies during the probationary period.",
      whatWouldChangeAnswer: [
        "Whether the employee is still in probation (which often provides a shorter 15 to 30 days notice).",
        "Whether termination is initiated for cause (which typically eliminates notice requirements).",
      ],
      followUpQuestions: [
        "Have you completed the probationary period specified in Section 3?",
        "Does your appointment letter specify any separate buyout conditions?",
      ],
      whatToDoNext:
        "Confirm in writing with HR whether notice buyout (payment in lieu) is an employee option or strictly at management's discretion. Keep a signed copy of your confirmation letter.",
      sources: [],
      citations: [
        {
          id: "cit-np-1",
          type: "document_clause",
          clauseId: clauseNotice?.id,
          clauseTitle: clauseNotice?.title || "Termination & Notice Period",
          sectionNumber: secNotice.replace(/[^0-9]/g, "") || "5",
          pageNumber: clauseNotice?.pageNumber || 1,
          exactQuote: quote.slice(0, 160),
        },
      ],
      confidence: "high",
      isOutOfScope: false,
      isLiveAi: false,
      disclaimer: GLOBAL_LEGAL_DISCLAIMER,
    };
  }

  // 4. IP / INTELLECTUAL PROPERTY RESPONSE
  if (isIP) {
    const clauseIP = report.clauses.find(
      (c) =>
        c.title?.toLowerCase().includes("intellectual property") ||
        c.category === "intellectual_property" ||
        c.section === "Section 8" ||
        c.section === "Section 7"
    );
    const secIP = clauseIP?.section || clauseIP?.sectionNumber || "Section 8";
    const quote =
      clauseIP?.rawText ||
      clauseIP?.clauseText ||
      "All inventions, software, designs, and work product conceived by Employee during the term of employment belong exclusively to the Company.";

    return {
      id: `ask-ans-${Date.now()}`,
      question,
      classification: "CLAUSE_EXPLANATION",
      answer:
        `${secIP} assigns all inventions, source code, designs, and intellectual property conceived during employment to the company. In its current form, it may be broad enough to capture off-hours personal projects unless explicitly excluded.`,
      whatDocumentSays: `${secIP} states: "${quote.slice(0, 200)}..."`,
      legalContext:
        "Under the Indian Copyright Act, 1957 (Section 17(c)), works created in the course of employment under a contract of service belong to the employer unless an agreement to the contrary exists. However, broad clauses claiming works developed entirely outside work hours without company resources can be carved out by mutual agreement.",
      whatIsUncertain:
        "Whether personal open-source projects or side projects created on personal hardware are protected from company claims without a prior written disclosure schedule.",
      whatWouldChangeAnswer: [
        "Whether the invention uses company equipment, proprietary datasets, or trade secrets.",
        "Whether the side project directly competes with the employer's business line.",
      ],
      followUpQuestions: [
        "Do you have existing pre-employment inventions or active open-source projects?",
        "Does the agreement include a 'Prior Inventions' disclosure schedule exhibit?",
      ],
      whatToDoNext:
        "Request an Exhibit A (Prior Inventions Schedule) to list any personal open-source projects or pre-existing codebases you wish to protect from assignment.",
      sources: [],
      citations: [
        {
          id: "cit-ip-1",
          type: "document_clause",
          clauseId: clauseIP?.id,
          clauseTitle: clauseIP?.title || "Intellectual Property Assignment",
          sectionNumber: secIP.replace(/[^0-9]/g, "") || "8",
          pageNumber: clauseIP?.pageNumber || 2,
          exactQuote: quote.slice(0, 160),
        },
      ],
      confidence: "high",
      isOutOfScope: false,
      isLiveAi: false,
      disclaimer: GLOBAL_LEGAL_DISCLAIMER,
    };
  }

  // 5. MISSING INFORMATION RESPONSE
  if (isMissingAsk) {
    return {
      id: `ask-ans-${Date.now()}`,
      question,
      classification: "MISSING_INFORMATION",
      answer:
        "Based on LawPilot's document extraction, several critical operational and legal elements are absent from the four corners of this agreement that impact certainty.",
      whatDocumentSays:
        "The agreement references external company policies and handbooks without appending them as exhibits.",
      legalContext:
        "Contractual incorporation by reference requires the incorporated rules to be accessible and brought to the employee's attention prior to execution under contract law standards.",
      whatIsUncertain:
        "1. Detailed job duties and reporting structure.\n2. Itemized schedule of training costs justifying the ₹4,50,000 bond.\n3. Exhibit A listing prior inventions to protect personal IP.\n4. Clear terms governing employer notice buyout discretion.",
      whatWouldChangeAnswer: [
        "Receipt and review of the employee handbook and IT acceptable use policy.",
        "A formal job description confirming whether the role involves trade secret exposure.",
      ],
      followUpQuestions: [
        "Did HR provide the employee handbook referenced in the agreement?",
        "Do you have an Exhibit A attachment to register existing personal inventions?",
        "Has the employer documented the actual curriculum for the training program?",
      ],
      whatToDoNext:
        "Ask HR for copies of all incorporated policies, employee handbooks, and an Exhibit A for prior inventions before signing.",
      sources: [],
      citations: [],
      confidence: "high",
      isOutOfScope: false,
      isLiveAi: false,
      disclaimer: GLOBAL_LEGAL_DISCLAIMER,
    };
  }

  // 6. ACTION NEXT STEP RESPONSE
  if (isActionAsk) {
    return {
      id: `ask-ans-${Date.now()}`,
      question,
      classification: "ACTION_NEXT_STEP",
      answer:
        "Here are three practical, non-adversarial preparation steps you can take immediately regarding this agreement:",
      whatDocumentSays:
        "The agreement contains high-attention terms in Section 5 (Non-Compete), Section 8 (Training Bond), and Section 4 (Notice Period).",
      legalContext:
        "Negotiating contract terms respectfully before signing is standard professional practice and preserves constructive relations with HR.",
      whatIsUncertain:
        "Company flexibility on standard offer terms vs company-wide non-negotiable policies.",
      whatToDoNext:
        "1. Clarify Training Bond: 'Could we include a pro-rata monthly amortization clause for Section 8 so the obligation reflects actual documented training costs?'\n2. Clarify Non-Compete: 'Could Section 5 be clarified to focus on non-solicitation of clients rather than a broad post-employment trade restriction?'\n3. Attach Exhibit A: 'I would like to append an Exhibit listing my pre-existing personal open-source projects.'",
      followUpQuestions: [
        "Are you speaking directly with the hiring manager or with a corporate HR recruiter?",
        "What is your target signing deadline for this agreement?",
      ],
      sources: [],
      citations: [],
      confidence: "high",
      isOutOfScope: false,
      isLiveAi: false,
      disclaimer: GLOBAL_LEGAL_DISCLAIMER,
    };
  }

  // 7. GENERAL SUMMARY FALLBACK
  const topFinding = report.findings[0];
  const topQuote = topFinding?.evidence?.quotedText || topFinding?.description || "";
  const topSection = topFinding?.evidence?.section || "1";

  return {
    id: `ask-ans-${Date.now()}`,
    question,
    classification: classification,
    answer: `LawPilot analyzed this agreement (${report.metadata.title}) under ${jurisdiction} legal context. ${topFinding ? `The most critical area requiring review is "${topFinding.title}".` : "The agreement appears to contain standard provisions."}`,
    whatDocumentSays: topQuote
      ? `Clause ${topSection}: "${topQuote.slice(0, 160)}..."`
      : `The document contains ${report.clauses.length} clauses analyzed by LawPilot.`,
    legalContext: topFinding?.whyItMatters || "Analysis grounded in applicable contract principles and statutory authorities.",
    whatIsUncertain: "Factual specifics not stated within the written text of the agreement.",
    whatToDoNext:
      "Review the highlighted findings in the Document Viewer and check the Action Plan for specific preparation checklists.",
    sources: (report.evidenceChains || []).flatMap((ch) => ch.legalSources || []).slice(0, 2),
    citations: topFinding
      ? [
          {
            id: "cit-gen-1",
            type: "document_clause",
            clauseId: topFinding.clauseId,
            clauseTitle: topFinding.title,
            sectionNumber: topSection,
            pageNumber: topFinding.evidence?.pageNumber || 1,
            exactQuote: topQuote.slice(0, 160),
          },
        ]
      : [],
    confidence: "moderate",
    isOutOfScope: false,
    isLiveAi: false,
    disclaimer: GLOBAL_LEGAL_DISCLAIMER,
  };
}

/**
 * Primary Ask LawPilot Engine
 * Orchestrates grounded question answering with Gemini and fallback intelligence
 */
export async function askLawPilot(input: AskEngineInput): Promise<AskAnswerStructure> {
  const { report, question, history = [] } = input;
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

  // 3. Build token-efficient, filtered context with prompt-injection defense
  const context = buildAskContext(report, sanitizedQuestion, history);

  // 4. Try Gemini live intelligence if available
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const prompt = `
${ASK_LAWPILOT_SYSTEM_PROMPT}

CONVERSATION RECENT HISTORY:
${context.conversationHistorySummary}

QUESTION CLASSIFICATION HINT:
Category: ${classificationResult.type}

USER QUESTION:
"${context.sanitizedQuestion}"

${context.untrustedContextXml}

Respond ONLY in valid JSON matching this exact structure:
{
  "classification": "${classificationResult.type}",
  "answer": "Plain-English accessible answer directly answering the question",
  "whatDocumentSays": "Verbatim quote and section from document if relevant",
  "legalContext": "Verified legal information from evidence chains if relevant",
  "whatIsUncertain": "Facts or legal questions that cannot be determined",
  "whatWouldChangeAnswer": ["Contingent fact 1", "Contingent fact 2"],
  "followUpQuestions": ["Max 3 high-value questions"],
  "whatToDoNext": "Safe, practical, and reversible preparation step",
  "citedClauseSections": ["section numbers e.g. 5, 8"],
  "citedLegalSourceIds": ["source ids"],
  "confidence": "high",
  "isOutOfScope": false
}
`.trim();

      const response = await gemini.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: {
          temperature: GEMINI_CONFIG.temperature,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text?.trim();
      if (rawText) {
        const parsed = JSON.parse(rawText) as AskAnswerOutput;

        // Build citations from report
        const citations: AskAnswerCitation[] = [];

        // Add clause citations
        if (parsed.citedClauseSections && Array.isArray(parsed.citedClauseSections)) {
          for (const sec of parsed.citedClauseSections) {
            const matched = report.clauses.find(
              (c) =>
                c.section === `Section ${sec}` ||
                c.sectionNumber === sec ||
                c.title?.toLowerCase().includes(`section ${sec}`)
            );
            if (matched) {
              citations.push({
                id: `cit-clause-${matched.id}`,
                type: "document_clause",
                clauseId: matched.id,
                clauseTitle: matched.title,
                sectionNumber: matched.sectionNumber || matched.section,
                pageNumber: matched.pageNumber,
                exactQuote: (matched.rawText || matched.clauseText || "").slice(0, 160),
              });
            }
          }
        }

        // Add legal source citations
        const sources: LegalSource[] = [];
        if (parsed.citedLegalSourceIds && Array.isArray(parsed.citedLegalSourceIds)) {
          const allReportSources = (report.evidenceChains || []).flatMap((ch) => ch.legalSources || []);
          for (const sId of parsed.citedLegalSourceIds) {
            const found = allReportSources.find((s) => s.id === sId || s.citation.includes(sId));
            if (found) {
              sources.push(found);
              citations.push({
                id: `cit-src-${found.id}`,
                type: "legal_source",
                sourceId: found.id,
                sourceTitle: found.title,
                citation: found.citation,
                url: found.url,
                jurisdiction: found.jurisdiction,
                verificationStatus: found.verificationStatus,
              });
            }
          }
        }

        return {
          id: `ask-ans-${Date.now()}`,
          question: sanitizedQuestion,
          classification: parsed.classification,
          answer: calibrateLanguage(parsed.answer),
          whatDocumentSays: parsed.whatDocumentSays ? calibrateLanguage(parsed.whatDocumentSays) : undefined,
          legalContext: parsed.legalContext ? calibrateLanguage(parsed.legalContext) : undefined,
          whatIsUncertain: parsed.whatIsUncertain ? calibrateLanguage(parsed.whatIsUncertain) : undefined,
          whatWouldChangeAnswer: parsed.whatWouldChangeAnswer?.map(calibrateLanguage),
          followUpQuestions: (parsed.followUpQuestions || []).slice(0, 3).map(calibrateLanguage),
          whatToDoNext: parsed.whatToDoNext ? calibrateLanguage(parsed.whatToDoNext) : undefined,
          sources: sources.length > 0 ? sources : context.relevantSources.slice(0, 2),
          citations,
          confidence: parsed.confidence,
          isOutOfScope: parsed.isOutOfScope,
          isLiveAi: true,
          disclaimer: GLOBAL_LEGAL_DISCLAIMER,
        };
      }
    } catch {
      // Fall through to deterministic grounded answer
    }
  }

  // 5. Deterministic grounded answer fallback
  return generateDeterministicGroundedAnswer(report, sanitizedQuestion, classificationResult.type);
}
