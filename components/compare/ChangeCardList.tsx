"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
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

export type FilterType =
  | "ALL_CHANGES"
  | "MATERIAL"
  | "OTHER"
  | "MODIFIED"
  | "ADDED"
  | "REMOVED"
  | "UNCHANGED";

export const ChangeCardList: React.FC<ChangeCardListProps> = ({
  changes,
  selectedChange,
  onSelectChange,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL_CHANGES");
  const [searchQuery, setSearchQuery] = useState("");

  // Computed counts across full set
  const counts = useMemo(() => {
    let changed = 0;
    let material = 0;
    let other = 0;
    let modified = 0;
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    for (const c of changes) {
      if (c.changeType !== "UNCHANGED") changed++;
      if (c.significance === "HIGH" || c.significance === "MEDIUM") material++;
      if (c.significance === "LOW" || c.significance === "INFORMATIONAL") other++;
      if (c.changeType === "MODIFIED") modified++;
      if (c.changeType === "ADDED") added++;
      if (c.changeType === "REMOVED") removed++;
      if (c.changeType === "UNCHANGED") unchanged++;
    }

    return { changed, material, other, modified, added, removed, unchanged };
  }, [changes]);

  const filteredChanges = useMemo(() => {
    return changes.filter((change) => {
      // Filter tab
      if (activeFilter === "ALL_CHANGES" && change.changeType === "UNCHANGED") return false;
      if (activeFilter === "MATERIAL" && change.significance !== "HIGH" && change.significance !== "MEDIUM") {
        return false;
      }
      if (activeFilter === "OTHER" && (change.significance === "HIGH" || change.significance === "MEDIUM" || change.changeType === "UNCHANGED")) {
        return false;
      }
      if (activeFilter === "MODIFIED" && change.changeType !== "MODIFIED") return false;
      if (activeFilter === "ADDED" && change.changeType !== "ADDED") return false;
      if (activeFilter === "REMOVED" && change.changeType !== "REMOVED") return false;
      if (activeFilter === "UNCHANGED" && change.changeType !== "UNCHANGED") return false;

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
    { id: "ALL_CHANGES", label: `All Changes (${counts.changed})` },
    { id: "MATERIAL", label: `Material (${counts.material})` },
    { id: "OTHER", label: `Other Edits (${counts.other})` },
    { id: "MODIFIED", label: `Modified (${counts.modified})` },
    { id: "ADDED", label: `Added (${counts.added})` },
    ...(counts.unchanged > 0
      ? [{ id: "UNCHANGED" as FilterType, label: `Unchanged (${counts.unchanged})` }]
      : []),
  ];

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Controls */}
      <div className="space-y-2.5">
        {/* Search Input (Cleanly sized, no clipped placeholder) */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search changes..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
          />
        </div>

        {/* Filter Pills (Scrollable horizontally on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeFilter === f.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simplified, Scannable Clause List */}
      <div className="space-y-2">
        {filteredChanges.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No changes match your selected filter criteria.
            </p>
          </div>
        ) : (
          filteredChanges.map((change) => {
            const isSelected = selectedChange?.id === change.id;
            const isUnchanged = change.changeType === "UNCHANGED";

            return (
              <div
                key={change.id}
                data-testid="clause-change-item"
                data-clause-id={change.id}
                onClick={() => onSelectChange(change)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs"
                    : isUnchanged
                    ? "border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 hover:border-slate-300 dark:hover:border-slate-700 opacity-80"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                }`}
              >
                {/* Header line: Badges + Section */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!isUnchanged && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getSignificanceBadge(
                          change.significance
                        )}`}
                      >
                        {change.significance}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getChangeTypeBadge(
                        change.changeType
                      )}`}
                    >
                      {change.changeType}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                    {change.currentSection || change.previousSection}
                  </span>
                </div>

                {/* Main line: Clause Title */}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {change.clauseTitle}
                  </h4>
                  {isUnchanged && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
