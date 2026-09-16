import type { AnalysisReport } from "@/types";
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

