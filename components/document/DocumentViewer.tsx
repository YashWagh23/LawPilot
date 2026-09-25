"use client";

import React, { useState } from "react";
import type { Clause, EvidenceLink } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  CheckCircle2,
} from "lucide-react";
import { SeverityBadge } from "@/components/evidence/SeverityBadge";

interface DocumentViewerProps {
  clauses: Clause[];
  selectedClauseId?: string | null;
  activeEvidenceLink?: EvidenceLink | null;
  documentTitle: string;
  totalPageCount?: number | null;
  onSelectClause?: (clauseId: string) => void;
}

export function DocumentViewer({
  clauses,
  selectedClauseId,
  activeEvidenceLink,
  documentTitle,
  totalPageCount = 1,
  onSelectClause,
}: DocumentViewerProps) {
  const [userPage, setUserPage] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // The page follows the selected clause: a manual page change only sticks until the selection changes.
  const [lastSelectedClauseId, setLastSelectedClauseId] = useState(selectedClauseId);
  if (lastSelectedClauseId !== selectedClauseId) {
    setLastSelectedClauseId(selectedClauseId);
    setUserPage(null);
  }

  const activeClause =
    clauses.find((c) => c.id === selectedClauseId) || clauses[0] || null;

  const maxPages = Math.max(totalPageCount || 1, 1);
  const currentPage = Math.min(
    maxPages,
    Math.max(1, userPage ?? (activeClause?.pageNumber || 1))
  );

  const handlePageChange = (newPage: number) => {
    setUserPage(Math.min(maxPages, Math.max(1, newPage)));
  };

  // Filter clauses by search term
  const filteredClauses = clauses.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      c.section.toLowerCase().includes(term) ||
      c.rawText.toLowerCase().includes(term)
    );
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col h-[520px] sm:h-[640px] overflow-hidden">
      {/* Viewer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {documentTitle}
          </span>
          <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 shrink-0">
            {clauses.length} Clauses
          </span>
        </div>

        {/* Page navigation controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-1.5 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
            Page {currentPage} of {maxPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= maxPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-1.5 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main split: Clause Index sidebar + Source Text Document Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Left: Clause Quick Jump List (4 cols) */}
        <div className="md:col-span-4 flex flex-col min-h-0 max-h-[170px] md:max-h-none bg-slate-50/40 dark:bg-slate-950/40">
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter clauses..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredClauses.map((c) => {
              const isSelected = c.id === activeClause?.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectClause?.(c.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-300 dark:bg-blue-950/60 dark:border-blue-700"
                      : "bg-white border-slate-200/80 hover:bg-slate-100/60 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate">
                      {c.section}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                      {c.pageNumber ? `p.${c.pageNumber}` : "n/a"}
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {c.title}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      {c.category}
                    </span>
                    {c.importance !== "informational" && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {c.importance === "critical_attention" ? "CRITICAL" : "ATTENTION"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Clause & Document Source Excerpt (8 cols) */}
        <div className="md:col-span-8 flex flex-col min-h-0 overflow-y-auto p-5 space-y-4">
          {activeClause ? (
            <div className="space-y-4">
              {/* Clause Header & Importance */}
              <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {activeClause.section}
                    </span>
                    <SeverityBadge severity={activeClause.importance} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {activeClause.pageNumber
                        ? `Document Page ${activeClause.pageNumber}`
                        : "Location unavailable"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeClause.title}
                  </h3>
                </div>
              </div>

              {/* Plain English Translation Box */}
              <div className="p-3.5 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 dark:text-blue-300">
                  Plain English Explanation
                </span>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {activeClause.plainEnglish}
                </p>
              </div>

              {/* Exact Source Text Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Source Document Language (Verbatim)
                  </span>
                  {activeEvidenceLink && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Grounded Evidence Match
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {activeEvidenceLink && activeEvidenceLink.clauseId === activeClause.id
                    ? // Highlight the specific excerpt linked to the finding (whitespace-tolerant)
                      renderHighlightedExcerpt(activeClause.rawText, activeEvidenceLink.quotedText)
                    : activeClause.rawText}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <FileText className="w-8 h-8 opacity-40" />
              <p className="text-xs">Select a clause to inspect source text</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Safely highlights the exact evidence quote inside source text. The match ignores differences in
 * whitespace/line breaks (quotes are stored with single spaces; clause text keeps its newlines).
 */
function renderHighlightedExcerpt(fullText: string, quote: string) {
  const words = quote.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fullText;
  const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(words.map(escape).join("\\s+"));
  const match = pattern.exec(fullText);
  if (!match) {
    return fullText;
  }

  const before = fullText.slice(0, match.index);
  const matched = match[0];
  const after = fullText.slice(match.index + matched.length);

  return (
    <>
      {before}
      <mark className="bg-amber-200/80 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 px-1 py-0.5 rounded font-semibold">
        {matched}
      </mark>
      {after}
    </>
  );
}
