"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisReport } from "@/types";
import { AnalysisClientView } from "./AnalysisClientView";
import { FileQuestion, ArrowRight, Sparkles, UploadCloud } from "lucide-react";

interface AnalysisLoaderProps {
  id: string;
  initialReport: AnalysisReport | null;
}

export function AnalysisLoader({ id, initialReport }: AnalysisLoaderProps) {
  const [report, setReport] = useState<AnalysisReport | null>(initialReport);
  const [isLoading, setIsLoading] = useState(!initialReport);

  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
      setIsLoading(false);
      return;
    }

    // Attempt client-side retrieval from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`lawpilot_report_${id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as AnalysisReport;
          setReport(parsed);
          setIsLoading(false);
          return;
        }
      } catch (_e) {
        // Parse failure
      }
    }

    setIsLoading(false);
  }, [id, initialReport]);

  if (report) {
    return <AnalysisClientView report={report} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <span className="inline-block h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading document analysis report...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Document Report Not Found
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The requested analysis session (<code className="font-mono text-xs">{id}</code>) could not be retrieved from local memory or storage.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/review"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xs transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>

        <Link
          href="/analysis/demo-employment-agreement"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900 font-medium text-xs hover:bg-blue-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Open Flagship India Demo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
