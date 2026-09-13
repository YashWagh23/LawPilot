"use client";

import React from "react";
import { GitCompare, Sparkles } from "lucide-react";

interface CompareHeaderProps {
  onLoadDemo: () => void;
  isLoadingDemo?: boolean;
}

export const CompareHeader: React.FC<CompareHeaderProps> = ({
  onLoadDemo,
  isLoadingDemo = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Pathway 03
          </span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Semantic Legal Change Analysis
          </span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Understand · Verify · Act
          </span>
        </div>

        <button
          type="button"
          onClick={onLoadDemo}
          disabled={isLoadingDemo}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{isLoadingDemo ? "Loading Redline..." : "Load India Redline Demo"}</span>
          <span className="text-[10px] px-1 rounded bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800">
            🇮🇳
          </span>
        </button>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Compare Agreement Drafts & Revisions
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Upload two versions of a contract to identify altered obligations, shifted financial exposure, section renumbering, and newly introduced restrictions.
        </p>
      </div>
    </div>
  );
};
