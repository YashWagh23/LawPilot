"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowRight,
} from "lucide-react";
import type {
  ChangeSignificance,
  ChangeType,
  ClauseComparisonItem,
} from "@/types";

interface ChangeCardListProps {
  changes: ClauseComparisonItem[];
  selectedChange: ClauseComparisonItem | null;
  onSelectChange: (change: ClauseComparisonItem) => void;
}

type FilterType = "ALL" | "HIGH" | "MEDIUM" | "LOW" | "ADDED" | "REMOVED" | "MODIFIED";

export const ChangeCardList: React.FC<ChangeCardListProps> = ({
  changes,
  selectedChange,
  onSelectChange,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChanges = useMemo(() => {
    return changes.filter((change) => {
      // Filter tab
      if (activeFilter === "HIGH" && change.significance !== "HIGH") return false;
      if (activeFilter === "MEDIUM" && change.significance !== "MEDIUM") return false;
      if (activeFilter === "LOW" && change.significance !== "LOW") return false;
      if (activeFilter === "ADDED" && change.changeType !== "ADDED") return false;
      if (activeFilter === "REMOVED" && change.changeType !== "REMOVED") return false;
      if (activeFilter === "MODIFIED" && change.changeType !== "MODIFIED") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = change.clauseTitle.toLowerCase().includes(q);
        const summaryMatch = change.summary.toLowerCase().includes(q);
        const prevSecMatch = (change.previousSection || "").toLowerCase().includes(q);
        const currSecMatch = (change.currentSection || "").toLowerCase().includes(q);
        if (!titleMatch && !summaryMatch && !prevSecMatch && !currSecMatch) {
          return false;
        }
      }

      return true;
    });
  }, [changes, activeFilter, searchQuery]);

  const getSignificanceBadge = (sig: ChangeSignificance) => {
    switch (sig) {
      case "HIGH":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900";
      case "LOW":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900";
      case "INFORMATIONAL":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getChangeTypeBadge = (type: ChangeType) => {
    switch (type) {
      case "ADDED":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300";
      case "REMOVED":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300";
      case "MODIFIED":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300";
      case "MOVED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300";
      case "UNCHANGED":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
    }
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: "ALL", label: `All (${changes.length})` },
    { id: "HIGH", label: "High" },
    { id: "MEDIUM", label: "Medium" },
    { id: "LOW", label: "Low" },
    { id: "MODIFIED", label: "Modified" },
    { id: "ADDED", label: "Added" },
    { id: "REMOVED", label: "Removed" },
  ];

  return (
    <div className="space-y-4">
      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === f.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter changes by keyword..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Change Cards Container */}
      <div className="space-y-2.5">
        {filteredChanges.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No changes match your selected filter criteria.
            </p>
          </div>
        ) : (
          filteredChanges.map((change) => {
            const isSelected = selectedChange?.id === change.id;
            const isSectionMoved =
              change.previousSection &&
              change.currentSection &&
              change.previousSection !== change.currentSection;

            return (
              <div
                key={change.id}
                onClick={() => onSelectChange(change)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getSignificanceBadge(
                        change.significance
                      )}`}
                    >
                      {change.significance}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getChangeTypeBadge(
                        change.changeType
                      )}`}
                    >
                      {change.changeType}
                    </span>

                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {change.clauseTitle}
                    </span>
                  </div>

                  {/* Section indicator */}
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    {isSectionMoved ? (
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                        <span>{change.previousSection}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{change.currentSection}</span>
                      </span>
                    ) : (
                      <span>{change.currentSection || change.previousSection}</span>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {change.summary}
                </p>

                {change.semanticDetails && change.semanticDetails.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {change.semanticDetails.map((detail, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {detail.parameter}: {detail.changeSummary}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
