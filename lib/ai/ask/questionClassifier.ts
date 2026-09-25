import type { AskQuestionType } from "@/types/ask";

export interface QuestionClassificationResult {
  type: AskQuestionType;
  confidence: "high" | "moderate" | "low";
  reason: string;
  isOutOfScope: boolean;
  politeRedirection?: string;
}

/**
 * Normalizes text for classification matching
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

/**
 * Question Classifier for Ask LawPilot
 * Accurately categorizes inquiries into the 7 core LawPilot question types
 */
export function classifyQuestion(rawQuestion: string): QuestionClassificationResult {
  const norm = normalize(rawQuestion);

  // 1. OUT_OF_SCOPE checks
  const outOfScopePatterns = [
    /\b(weather|temperature|forecast|rain|sunny)\b/,
    /\b(stock|stocks|crypto|bitcoin|invest|trading|shares to buy)\b/,
    /\b(recipe|cook|baking|restaurant)\b/,
    /\b(poem|song|story|joke|riddle)\b/,
    /\b(sports|cricket score|football|fifa|world cup)\b/,
    /\b(movie|cinema|actor|celebrity)\b/,
    /\b(who is the president|capital of|how tall is)\b/,
    /\b(hack|hotwire|ddos|exploit|malware|virus|code a script|python script|write code)\b/,
  ];

  const hasLegalKeywords = /\b(contract|agreement|clause|section|legal|notice|salary|employer|employee|non-compete|bond|law|hr|lawyer|risk|obligation|party|ip|intellectual property)\b/.test(
    norm
  );

  for (const pattern of outOfScopePatterns) {
    if (pattern.test(norm) && !hasLegalKeywords) {
      return {
        type: "OUT_OF_SCOPE",
        confidence: "high",
        reason: "Question is unrelated to contracts, agreements, legal rights, or document analysis.",
        isOutOfScope: true,
        politeRedirection:
          "I am LawPilot, specialized exclusively in analyzing legal documents, contracts, and legal context. I cannot help with general trivia, investments, or unrelated topics. Please feel free to ask questions about your agreement's clauses, rights, notice periods, or practical next steps!",
      };
    }
  }

  // 2. MISSING_INFORMATION checks
  if (
    norm.includes("missing") ||
    norm.includes("what information is needed") ||
    norm.includes("what facts are missing") ||
    norm.includes("what is absent") ||
    norm.includes("cannot determine") ||
    norm.includes("what is not in the document")
  ) {
    return {
      type: "MISSING_INFORMATION",
      confidence: "high",
      reason: "User is asking about missing facts or gaps in the agreement.",
      isOutOfScope: false,
    };
  }

  // 3. ACTION_NEXT_STEP checks
  if (
    norm.includes("what should i ask") ||
    norm.includes("ask hr") ||
    norm.includes("show a lawyer") ||
    norm.includes("what to do next") ||
    norm.includes("what should i do") ||
    norm.includes("how to negotiate") ||
    norm.includes("steps to take") ||
    norm.includes("before signing") ||
    norm.includes("what action") ||
    norm.includes("how do i handle")
  ) {
    return {
      type: "ACTION_NEXT_STEP",
      confidence: "high",
      reason: "User is seeking practical, reversible preparation steps or negotiation questions.",
      isOutOfScope: false,
    };
  }

  // 4. RISK_INTERPRETATION checks
  if (
    /\bwhy\b.*\b(?:flag|flagged|risky|risk|concern|concerning|red flag|considered a risk|marked)\b/.test(norm) ||
    norm.includes("why did lawpilot flag") ||
    norm.includes("why is this flagged") ||
    norm.includes("why is this risky") ||
    norm.includes("why is section") && (norm.includes("risky") || norm.includes("flagged") || norm.includes("red")) ||
    norm.includes("why is this clause marked") ||
    norm.includes("severity") ||
    norm.includes("what are the risks")
  ) {
    return {
      type: "RISK_INTERPRETATION",
      confidence: "high",
      reason: "User is asking why a clause was flagged or what risks LawPilot identified.",
      isOutOfScope: false,
    };
  }

  // 5. LEGAL_CONTEXT checks
  if (
    norm.includes("enforceable") ||
    norm.includes("is this legal") ||
    norm.includes("is it valid") ||
    norm.includes("can my employer recover") ||
    norm.includes("recover the training") ||
    norm.includes("hold up in court") ||
    norm.includes("under indian law") ||
    norm.includes("under law") ||
    norm.includes("section 27") ||
    norm.includes("section 74") ||
    norm.includes("statute") ||
    norm.includes("case law") ||
    norm.includes("court precedent") ||
    norm.includes("can they enforce") ||
    norm.includes("can they sue") ||
    norm.includes("can they charge")
  ) {
    return {
      type: "LEGAL_CONTEXT",
      confidence: "high",
      reason: "User is asking about statutory enforceability, legality, or legal authorities.",
      isOutOfScope: false,
    };
  }

  // 6. CLAUSE_EXPLANATION checks
  if (
    norm.includes("explain") ||
    norm.includes("what does") && (norm.includes("mean") || norm.includes("cover") || norm.includes("say")) ||
    norm.includes("summary of clause") ||
    norm.includes("what is the non compete") ||
    norm.includes("what is intellectual property") ||
    norm.includes("what is confidentiality") ||
    norm.includes("what does section")
  ) {
    return {
      type: "CLAUSE_EXPLANATION",
      confidence: "high",
      reason: "User is asking to explain or deconstruct the meaning of a specific clause.",
      isOutOfScope: false,
    };
  }

  // 7. DOCUMENT_FACT checks (notice period, salary, parties, dates, numbers)
  if (
    norm.includes("notice period") ||
    norm.includes("how long") ||
    norm.includes("how much") ||
    norm.includes("salary") ||
    norm.includes("compensation") ||
    norm.includes("effective date") ||
    norm.includes("who are the parties") ||
    norm.includes("who signed") ||
    norm.includes("job title") ||
    norm.includes("working hours") ||
    norm.includes("where is") ||
    norm.includes("what is my")
  ) {
    return {
      type: "DOCUMENT_FACT",
      confidence: "high",
      reason: "User is querying specific factual terms, numbers, or dates stated in the document.",
      isOutOfScope: false,
    };
  }

  // Default fallback: If it mentions clauses/agreements, treat as CLAUSE_EXPLANATION, otherwise DOCUMENT_FACT
  if (norm.includes("clause") || norm.includes("section")) {
    return {
      type: "CLAUSE_EXPLANATION",
      confidence: "moderate",
      reason: "Query mentions a clause or section structure.",
      isOutOfScope: false,
    };
  }

  return {
    type: "DOCUMENT_FACT",
    confidence: "moderate",
    reason: "Query appears to relate to document contents or obligations.",
    isOutOfScope: false,
  };
}
