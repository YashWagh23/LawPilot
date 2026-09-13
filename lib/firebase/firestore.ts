import type { AnalysisReport, Document } from "@/types";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { getCachedAnalysisReport } from "@/lib/analysis/analysisOrchestrator";

/**
 * Firestore Service Layer
 * Clean abstraction for document & report retrieval and persistence.
 */

export async function getAnalysisReportById(
  id: string
): Promise<AnalysisReport | null> {
  // Check memory cache first (for newly uploaded and processed files)
  const cached = getCachedAnalysisReport(id);
  if (cached) {
    return cached;
  }

  // Demo data fallback when running in preview or offline mode
  if (
    id === "demo-employment-agreement" ||
    id === "demo-commercial-lease" ||
    id === SAMPLE_ANALYSIS_REPORT.id
  ) {
    return SAMPLE_ANALYSIS_REPORT;
  }

  // Ready for live Firestore: getDoc(doc(db, "reports", id))
  return null;
}

export async function saveAnalysisReport(
  _report: AnalysisReport
): Promise<string> {
  // Ready for live Firestore: setDoc(doc(db, "reports", report.id), report)
  return "demo-saved-id";
}

export async function getRecentDocuments(): Promise<Document[]> {
  // Returns safe sample documents
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
