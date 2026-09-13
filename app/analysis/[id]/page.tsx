import React from "react";
import { getAnalysisReportById } from "@/lib/storage/reportStore";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { AnalysisLoader } from "@/components/analysis/AnalysisLoader";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Immediate synchronous match for demo documents
  const report =
    id === "demo-employment-agreement" ||
    id === "demo-commercial-lease" ||
    id === SAMPLE_ANALYSIS_REPORT.id
      ? SAMPLE_ANALYSIS_REPORT
      : await getAnalysisReportById(id);

  return <AnalysisLoader id={id} initialReport={report} />;
}

