"use client";

import React from "react";
import {
  Scale,
  ArrowRight,
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

export const ComparisonSummaryView: React.FC<ComparisonSummaryViewProps> = ({
  summary,
  jurisdictionComparison,
  topMaterialChanges,
  fullComparison: _fullComparison,
  onSelectChange,
  selectedChangeId,
}) => {

  return (
    <div className="space-y-6">
      {/* ── Headline: WHAT CHANGED? ── */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              What Changed?
            </h2>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {summary.materialChangesCount} important {summary.materialChangesCount === 1 ? "change" : "changes"}
            </p>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {summary.clausesChanged} modified · {summary.clausesAdded} added · {summary.clausesRemoved} removed
          </span>
        </div>

        {/* Highlighted Parameter Changes (e.g. ₹2L → ₹4.5L, 60 → 90 days) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {topMaterialChanges.slice(0, 3).map((change) => {
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

            const isSelected = selectedChangeId === change.id;

            return (
              <div
                key={change.id}
                onClick={() => onSelectChange(change)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/30 dark:border-indigo-500/60 dark:bg-indigo-950/30 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700"
                }`}
              >
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono block">
                  {deltaDisplay}
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                  {change.clauseTitle}
                </span>
                <button
                  type="button"
                  className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1 pt-1"
                >
                  <span>View details</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Subtle Jurisdiction Note */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <Scale className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {jurisdictionComparison.isAligned
              ? "Governing Law: India · Maharashtra (Consistent in both versions)"
              : `Jurisdiction alert: ${jurisdictionComparison.warning || "Governing law differs between drafts"}`}
          </span>
        </div>
      </div>
    </div>
  );
};
