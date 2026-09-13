"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { AnalysisReport } from "@/types";
import { AnalysisClientView } from "./AnalysisClientView";
import { FileQuestion, ArrowRight, Sparkles, UploadCloud } from "lucide-react";

interface AnalysisLoaderProps {
  id: string;
  initialReport: AnalysisReport | null;
}

export function AnalysisLoader({ id, initialReport }: AnalysisLoaderProps) {
  const [report] = useState<AnalysisReport | null>(() => {
    if (initialReport) return initialReport;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`lawpilot_report_${id}`);
        if (stored) {
          return JSON.parse(stored) as AnalysisReport;
        }
      } catch {
        // Parse failure
      }
    }
    return null;
  });

  if (report) {
    return <AnalysisClientView report={report} />;
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
          <span>Open Sample Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
