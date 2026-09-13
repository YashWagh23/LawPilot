"use client";

import React from "react";
import {
  ShieldAlert,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  Scale,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type {
  ClauseComparisonItem,
  ComparisonSummary,
  JurisdictionComparison,
} from "@/types";

interface ComparisonSummaryViewProps {
  summary: ComparisonSummary;
  jurisdictionComparison: JurisdictionComparison;
  topMaterialChanges: ClauseComparisonItem[];
  onSelectChange: (change: ClauseComparisonItem) => void;
  selectedChangeId?: string;
}

export const ComparisonSummaryView: React.FC<ComparisonSummaryViewProps> = ({
  summary,
  jurisdictionComparison,
  topMaterialChanges,
  onSelectChange,
  selectedChangeId,
}) => {
  return (
    <div className="space-y-6">
      {/* Jurisdiction Alignment or Warning Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          jurisdictionComparison.isAligned
            ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
            : "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              jurisdictionComparison.isAligned
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
            }`}
          >
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {jurisdictionComparison.statusLabel}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/70 dark:bg-slate-900/60 font-medium">
                {jurisdictionComparison.isAligned ? "Governing Law Consistent" : "Mismatch Alert"}
              </span>
            </div>
            {jurisdictionComparison.warning ? (
              <p className="text-xs mt-1 text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                {jurisdictionComparison.warning}
              </p>
            ) : (
              <p className="text-xs mt-0.5 text-emerald-700 dark:text-emerald-400">
                Both agreements submit to the exclusive jurisdiction of the Courts in Mumbai, Maharashtra under Indian law.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Material Changes */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Material Changes
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-900 dark:text-rose-100">
            {summary.materialChangesCount}
          </div>
          <p className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
            {summary.highSignificanceCount} High · {summary.mediumSignificanceCount} Medium
          </p>
        </div>

        {/* Metric 2: Clauses Changed / Modified */}
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Clauses Modified
            </span>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
            {summary.clausesChanged}
          </div>
          <p className="text-[10px] text-blue-600 dark:text-blue-400">
            Semantic alterations detected
          </p>
        </div>

        {/* Metric 3: Clauses Added */}
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 dark:border-purple-900/60 dark:bg-purple-950/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Clauses Added
            </span>
            <PlusCircle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-900 dark:text-purple-100">
            {summary.clausesAdded}
          </div>
          <p className="text-[10px] text-purple-600 dark:text-purple-400">
            New sections introduced
          </p>
        </div>

        {/* Metric 4: Clauses Removed */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Clauses Removed
            </span>
            <MinusCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {summary.clausesRemoved}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Omitted protections
          </p>
        </div>

        {/* Metric 5: Clauses Unchanged / Moved */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Unchanged / Moved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
            {summary.clausesUnchanged + summary.clausesMoved}
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
            {summary.clausesMoved > 0 ? `${summary.clausesMoved} renumbered` : "Identical language"}
          </p>
        </div>
      </div>

      {/* Top 3-5 Material Changes Banner */}
      {topMaterialChanges.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">
                Key Material Shifts Requiring Clarification
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Click any card to inspect side-by-side
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topMaterialChanges.slice(0, 3).map((change) => {
              const isSelected = selectedChangeId === change.id;
              const hasDiff = change.semanticDetails && change.semanticDetails.length > 0;
              const mainDiff = hasDiff ? change.semanticDetails![0] : null;

              return (
                <div
                  key={change.id}
                  onClick={() => onSelectChange(change)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900">
                      {change.significance} SIGNIFICANCE
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {change.currentSection || change.previousSection}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {change.clauseTitle}
                  </h3>

                  {mainDiff ? (
                    <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono">
                      <div className="text-slate-500 line-through truncate">
                        {mainDiff.previousValue}
                      </div>
                      <div className="text-rose-600 dark:text-rose-400 font-bold truncate">
                        → {mainDiff.currentValue}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {change.summary}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    <span>Inspect Difference</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
