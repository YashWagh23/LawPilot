"use client";

import React from "react";
import {
  Scale,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type {
  ClauseComparisonItem,
  ComparisonSummary,
  JurisdictionComparison,
  DocumentComparisonResult,
} from "@/types";

interface ComparisonSummaryViewProps {
  summary: ComparisonSummary;
  jurisdictionComparison: JurisdictionComparison;
  topMaterialChanges: ClauseComparisonItem[];
  fullComparison?: DocumentComparisonResult;
  onSelectChange: (change: ClauseComparisonItem) => void;
  selectedChangeId?: string;
}

/**
 * Returns a punchy, 1-sentence "Why It Matters" summary for the top summary cards
 */
export function getConciseWhyItMatters(change: ClauseComparisonItem): string {
  const normTitle = change.clauseTitle.toLowerCase();
  if (normTitle.includes("notice")) {
    return "Longer exit obligation that restricts career mobility and increases deduction risk.";
  }
  if (normTitle.includes("training") || normTitle.includes("bond")) {
    return "Substantially higher contractual financial clawback exposure.";
  }
  if (normTitle.includes("non-compete")) {
    return "Expanded post-employment restrictions on working in your industry across India.";
  }
  if (normTitle.includes("intellectual") || normTitle.includes("inventions")) {
    return "Broadened employer claims over personal software code created outside work hours.";
  }
  if (normTitle.includes("arbitrat") || normTitle.includes("dispute")) {
    return "Shifts dispute resolution to unilateral arbitrator appointment by employer MD.";
  }

  if (change.whyItMatters) {
    const firstSentence = change.whyItMatters.split(/\.\s+/)[0].trim();
    return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
  }

  return "Material contractual term modification.";
}

export const ComparisonSummaryView: React.FC<ComparisonSummaryViewProps> = ({
  summary,
  jurisdictionComparison,
  topMaterialChanges,
  fullComparison: _fullComparison,
  onSelectChange,
  selectedChangeId,
}) => {
  const totalChangesCount = summary.clausesChanged + summary.clausesAdded + summary.clausesRemoved;
  const materialCount = topMaterialChanges.length;

  return (
    <div className="space-y-6">
      {/* Headline Card: WHAT CHANGED? */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-1 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                What Changed?
              </span>
              <span className="text-xs text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {totalChangesCount} total changes across drafts
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {`${materialCount} material ${materialCount === 1 ? "change" : "changes"}`}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 font-sans">
                Worth Your Attention
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Showing all {materialCount} material changes requiring review · {summary.clausesChanged} modified · {summary.clausesAdded} added
              {summary.clausesRemoved > 0 ? ` · ${summary.clausesRemoved} removed` : ""}
            </p>
          </div>

          {/* Compact Secondary Jurisdiction Badge */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-medium">
              {jurisdictionComparison.isAligned
                ? "Governing Law: India · Maharashtra"
                : `Jurisdiction: ${jurisdictionComparison.statusLabel}`}
            </span>
          </div>
        </div>

        {/* All Material Changes Cards (No arbitrary slice truncation) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {topMaterialChanges.map((change) => {
            const firstDetail = change.semanticDetails?.[0];
            const deltaDisplay =
              firstDetail?.previousValue && firstDetail?.currentValue
                ? `${firstDetail.previousValue} → ${firstDetail.currentValue}`
                : firstDetail?.changeSummary
                ? firstDetail.changeSummary
                : change.changeType === "ADDED"
                ? "New clause added"
                : change.changeType === "REMOVED"
                ? "Clause removed"
                : "Modified term";

            const conciseWhy = getConciseWhyItMatters(change);
            const isSelected = selectedChangeId === change.id;

            return (
              <div
                key={change.id}
                onClick={() => onSelectChange(change)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 hover:shadow-xs"
                }`}
              >
                <div className="space-y-1">
                  {/* CHANGE DELTA */}
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono block leading-tight">
                    {deltaDisplay}
                  </span>

                  {/* CLAUSE TITLE */}
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-snug line-clamp-1">
                    {change.clauseTitle}
                  </span>

                  {/* WHY IT MATTERS */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {conciseWhy}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {change.currentSection || change.previousSection}
                  </span>

                  <button
                    type="button"
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Data Consistency Notice if zero material changes */}
        {topMaterialChanges.length === 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span>No material differences detected between these versions.</span>
          </div>
        )}
      </div>
    </div>
  );
};
