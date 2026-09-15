import { NextRequest, NextResponse } from "next/server";
import { answerClauseQuestion } from "@/lib/ai/agents/legalResearchAgent";
import type { Clause, Finding, LegalSource } from "@/types";

export async function POST(req: NextRequest) {
  try {
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

    const answer = await answerClauseQuestion(
      {
        documentId,
        clauseId,
        question: question.trim(),
        jurisdiction,
      },
      finding || undefined,
      clause || undefined,
      sources
    );

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to analyze clause question.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
