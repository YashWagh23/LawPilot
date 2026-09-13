import type { AnalysisReport, Document } from "@/types";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";

// In-memory runtime cache of analyzed reports (frictionless local-first retrieval across modules)
declare global {
  var __lawpilot_report_cache__: Map<string, AnalysisReport> | undefined;
}

const reportCache: Map<string, AnalysisReport> =
  globalThis.__lawpilot_report_cache__ || new Map<string, AnalysisReport>();
if (!globalThis.__lawpilot_report_cache__) {
  globalThis.__lawpilot_report_cache__ = reportCache;
}

export function getCachedAnalysisReport(id: string): AnalysisReport | null {
  return reportCache.get(id) || null;
}

export function saveCachedAnalysisReport(report: AnalysisReport): void {
  reportCache.set(report.id, report);
}

/**
 * In-Memory & Demo Report Store
 * Provides fast retrieval of analysis reports from the active cache
 * and pre-packaged demo documents for zero-auth exploration.
 */

export async function getAnalysisReportById(
  id: string
): Promise<AnalysisReport | null> {
  // Check memory cache first (for newly uploaded and processed files in the current session)
  const cached = getCachedAnalysisReport(id);
  if (cached) {
    return cached;
  }

  // Pre-packaged demo reports available without external database calls
  if (
    id === "demo-employment-agreement" ||
    id === "demo-commercial-lease" ||
    id === SAMPLE_ANALYSIS_REPORT.id
  ) {
    return SAMPLE_ANALYSIS_REPORT;
  }

  return null;
}

export async function saveAnalysisReport(
  _report: AnalysisReport
): Promise<string> {
  return "local-session-saved";
}

export async function getRecentDocuments(): Promise<Document[]> {
  // Sample reference agreements for workspace exploration
  return [
    {
      id: "demo-commercial-lease",
      title: "Commercial Lease Agreement - Suite 400",
      fileName: "Commercial_Lease_Suite400_Executed.pdf",
      fileSizeBytes: 2450000,
      fileType: "application/pdf",
      uploadedAt: "2026-03-10T14:22:00Z",
      analysisId: "demo-commercial-lease",
      status: "analyzed",
    },
    {
      id: "demo-services-contract",
      title: "Master Services Agreement (Tech Consulting)",
      fileName: "MSA_Consulting_Draft_v2.docx",
      fileSizeBytes: 890000,
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadedAt: "2026-03-08T09:15:00Z",
      status: "uploaded",
    },
    {
      id: "demo-nda-mutual",
      title: "Mutual Non-Disclosure Agreement",
      fileName: "Mutual_NDA_Standard_2026.pdf",
      fileSizeBytes: 310000,
      fileType: "application/pdf",
      uploadedAt: "2026-02-28T16:40:00Z",
      status: "analyzed",
    },
  ];
}
