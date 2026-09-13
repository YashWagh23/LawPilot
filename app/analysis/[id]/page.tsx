import React from "react";
import { notFound } from "next/navigation";
import { getAnalysisReportById } from "@/lib/firebase/firestore";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { AnalysisClientView } from "@/components/analysis/AnalysisClientView";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report =
    (await getAnalysisReportById(id)) ||
    (id === "demo-commercial-lease" ? SAMPLE_ANALYSIS_REPORT : null);

  if (!report) {
    notFound();
  }

  return <AnalysisClientView report={report} />;
}
