import { NextRequest, NextResponse } from "next/server";
import { answerClauseQuestion } from "@/lib/ai/agents/legalResearchAgent";
import type { Clause, Finding, LegalSource } from "@/types";
import { checkRateLimit } from "@/lib/safety/rateLimiter";
import { isDeclaredContentLengthTooLarge } from "@/lib/documents/fileValidator";

const MAX_QUESTION_LENGTH = 2000;
const MAX_SOURCES = 20;
const MAX_REQUEST_BODY_BYTES = 512 * 1024;

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, "ask-clause", 30, 60_000);
    if (rateLimit.limited) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    if (isDeclaredContentLengthTooLarge(req, MAX_REQUEST_BODY_BYTES)) {
      return NextResponse.json(
        { success: false, error: "Request body is too large." },
        { status: 413 }
      );
    }

    const body = await req.json();
    const {
      question,
      clauseId = "clause-active",
      documentId = "active-doc",
      jurisdiction = "Applicable Law",
      finding,
      clause,
      sources = [],
    }: {
      question?: string;
      clauseId?: string;
      documentId?: string;
      jurisdiction?: string;
      finding?: Finding | null;
      clause?: Clause | null;
      sources?: LegalSource[];
    } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "A valid question is required." },
        { status: 400 }
      );
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Question exceeds the maximum length of ${MAX_QUESTION_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    const safeSources = Array.isArray(sources) ? sources.slice(0, MAX_SOURCES) : [];

    const answer = await answerClauseQuestion(
      {
        documentId,
        clauseId,
        question: question.trim(),
        jurisdiction,
      },
      finding || undefined,
      clause || undefined,
      safeSources
    );

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to analyze clause question.";
    return NextResponse.json(
      { success: false, error: message.slice(0, 200) },
      { status: 500 }
    );
  }
}
