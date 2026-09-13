import { NextRequest, NextResponse } from "next/server";
import type { AnalysisReport } from "@/types";
import type { AskConversationMessage } from "@/types/ask";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { getAnalysisReportById, getCachedAnalysisReport } from "@/lib/storage/reportStore";
import { askLawPilot } from "@/lib/ai/ask/askEngine";

const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 25;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      documentId,
      question,
      history = [],
      clientReport,
    }: {
      documentId: string;
      question: string;
      history?: AskConversationMessage[];
      clientReport?: AnalysisReport;
    } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid question." },
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

    if (!documentId || typeof documentId !== "string" || !documentId.trim()) {
      return NextResponse.json(
        { success: false, error: "Document ID is required." },
        { status: 400 }
      );
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-MAX_HISTORY_LENGTH)
      : [];

    // Resolve Report:
    // 1. Direct match for demo
    let report: AnalysisReport | null = null;
    if (
      documentId === "demo-employment-agreement" ||
      documentId === "demo-commercial-lease" ||
      documentId === SAMPLE_ANALYSIS_REPORT.id
    ) {
      report = SAMPLE_ANALYSIS_REPORT;
    }

    // 2. In-memory runtime cache lookup (local session)
    if (!report) {
      report = getCachedAnalysisReport(documentId);
    }

    // 3. Try client-provided report (local-first storage recovery)
    if (!report && clientReport && clientReport.id === documentId) {
      report = clientReport;
    }

    // 4. Try server store
    if (!report) {
      report = await getAnalysisReportById(documentId);
    }

    // 5. Fallback if still not found
    if (!report && clientReport) {
      report = clientReport;
    }

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: "Document analysis session not found. Please upload or open a valid document report.",
        },
        { status: 404 }
      );
    }

    // Execute Ask LawPilot grounded intelligence engine
    const answer = await askLawPilot({
      report,
      question: question.trim(),
      history: safeHistory,
    });

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process question.";
    return NextResponse.json(
      {
        success: false,
        error: `Ask LawPilot encountered an issue: ${message.slice(0, 200)}`,
      },
      { status: 500 }
    );
  }
}
