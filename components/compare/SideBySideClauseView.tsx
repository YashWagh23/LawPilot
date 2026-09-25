"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  CheckSquare,
  Scale,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  ClauseComparisonItem,
} from "@/types";
import { getChainVerificationBadge, VERIFICATION_TONE_CLASSES } from "@/lib/analysis/verificationState";
import {
  addCompareActionItem,
  isCompareActionItemAdded,
  COMPARE_ACTION_EVENT,
} from "@/lib/comparison/compareActionStore";

interface SideBySideClauseViewProps {
  change: ClauseComparisonItem;
  onAskLawPilot: (question: string) => void;
  onActionAdded?: (title: string) => void;
}

export const SideBySideClauseView: React.FC<SideBySideClauseViewProps> = ({
  change,
  onAskLawPilot,
  onActionAdded,
}) => {
  const actionItem = change.suggestedActionItem;

  const [prevItemId, setPrevItemId] = useState(actionItem?.id);
  // Real persistent saved state from compareActionStore
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window === "undefined" || !actionItem) return false;
    return isCompareActionItemAdded(actionItem.id, actionItem.title);
  });

  // Adjust state synchronously during render when the selected change changes
  if (actionItem?.id !== prevItemId) {
    setPrevItemId(actionItem?.id);
    setIsSaved(actionItem ? isCompareActionItemAdded(actionItem.id, actionItem.title) : false);
  }

  // Separate transient confirmation animation
  const [justAdded, setJustAdded] = useState(false);
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);
  const [mobileView, setMobileView] = useState<"stacked" | "previous" | "current">("stacked");

  // Synchronize saved state on external store updates or cross-tab storage events
  React.useEffect(() => {
    const syncSavedState = () => {
      if (!actionItem) return;
      setIsSaved(isCompareActionItemAdded(actionItem.id, actionItem.title));
    };

    window.addEventListener(COMPARE_ACTION_EVENT, syncSavedState);
    window.addEventListener("storage", syncSavedState);
    return () => {
      window.removeEventListener(COMPARE_ACTION_EVENT, syncSavedState);
      window.removeEventListener("storage", syncSavedState);
    };
  }, [actionItem]);

  const handleAddToActionPlan = () => {
    if (isSaved || !actionItem) return;
    const added = addCompareActionItem(actionItem);
    if (added) {
      setIsSaved(true);
      setJustAdded(true);
      onActionAdded?.(actionItem.title);
      setTimeout(() => setJustAdded(false), 2000); // Resets transient animation only, not isSaved
    }
  };

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

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden space-y-5">
      {/* ── 1. Top Section: Clause, Section & Delta ── */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                {change.category.replace("_", " ")}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {change.previousSection && change.currentSection && change.previousSection !== change.currentSection
                  ? `${change.previousSection} → ${change.currentSection}`
                  : change.currentSection || change.previousSection}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                {change.significance} SIGNIFICANCE
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {change.clauseTitle}
            </h2>

            {/* Prominent Delta Display */}
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-100/60 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300 font-mono text-sm font-bold">
                <span>Change:</span>
                <span>{deltaDisplay}</span>
              </span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleAddToActionPlan}
              disabled={isSaved}
              aria-pressed={isSaved}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] ${
                isSaved
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 cursor-default"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
              } ${justAdded ? "scale-[1.02] ring-2 ring-emerald-500/50" : ""}`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span>Saved to Action Plan</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Add to Action Plan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onAskLawPilot(change.suggestedAskQuestion)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-semibold shadow-xs transition-colors cursor-pointer min-h-[40px]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask LawPilot</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 space-y-5">
        {/* ── 2. WHY THIS MATTERS (Practical Impact) ── */}
        <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20 p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Why This Matters
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-semibold">
              Practical & Financial Exposure
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {change.whyItMatters}
          </p>
        </div>

        {/* ── 3. WHAT TO VERIFY & WHAT TO ASK ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WHAT TO VERIFY */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              What to Verify
            </span>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {change.whatToVerify.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* WHAT TO ASK */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              What to Ask
            </span>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
              &ldquo;{change.whatToAsk}&rdquo;
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Calibrated wording to clarify with HR or counterparty.
            </p>
          </div>
        </div>

        {/* ── 4. LANGUAGE COMPARISON (Side-by-Side Redline) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clause Language Comparison
            </h3>

            {/* Mobile View Selector (Previous | Revised | Both Stacked) */}
            <div className="flex md:hidden items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMobileView("stacked")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mobileView === "stacked"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Stacked
              </button>
              <button
                type="button"
                onClick={() => setMobileView("previous")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mobileView === "previous"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setMobileView("current")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mobileView === "current"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Revised
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* PREVIOUS VERSION */}
            <div
              className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2 ${
                mobileView === "current" ? "hidden md:block" : "block"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  PREVIOUS VERSION
                </span>
                <span className="text-[10px] font-sans font-mono text-slate-500">
                  {change.previousSection || "Omitted"}
                </span>
              </div>
              <p className="leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words font-sans text-xs">
                {change.whatChanged.original || "None"}
              </p>
            </div>

            {/* CURRENT VERSION */}
            <div
              className={`rounded-xl border p-4 space-y-2 ${
                mobileView === "previous" ? "hidden md:block" : "block"
              } ${
                change.changeType === "ADDED"
                  ? "border-purple-200 bg-purple-50/30 dark:border-purple-900/60 dark:bg-purple-950/20"
                  : change.changeType === "REMOVED"
                  ? "border-rose-200 bg-rose-50/30 dark:border-rose-900/60 dark:bg-rose-950/20"
                  : "border-blue-200 bg-blue-50/30 dark:border-blue-900/60 dark:bg-blue-950/20"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-900/60">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  CURRENT VERSION (REVISED)
                </span>
                <span className="text-[10px] font-sans font-mono text-blue-600 dark:text-blue-400">
                  {change.currentSection || "Omitted"}
                </span>
              </div>
              <p className="leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words font-sans text-xs">
                {change.whatChanged.revised || "None"}
              </p>
            </div>
          </div>
        </div>

        {/* ── 5. LEGAL CONTEXT & EVIDENCE (Behind Interaction) ── */}
        {change.evidenceChain && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  View Evidence & Statutory Authorities
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${VERIFICATION_TONE_CLASSES[getChainVerificationBadge(change.evidenceChain).tone].pill}`}
                  title={getChainVerificationBadge(change.evidenceChain).detail}
                >
                  {getChainVerificationBadge(change.evidenceChain).label}
                </span>
              </div>
              {isEvidenceExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isEvidenceExpanded && (
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/60 space-y-3 text-xs">
                {/* Finding & Claim */}
                <div className="mt-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Legal Principle & Interpretation
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {change.evidenceChain.legalClaims[0]?.claim}
                  </p>
                </div>

                {/* Primary Source */}
                {change.evidenceChain.legalSources[0] && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{change.evidenceChain.legalSources[0].citation}</span>
                      <span className="capitalize text-blue-600 dark:text-blue-400">
                        {change.evidenceChain.legalSources[0].sourceType.replace("_", " ")}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {change.evidenceChain.legalSources[0].title}
                    </p>
                    {change.evidenceChain.legalSources[0].notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        {change.evidenceChain.legalSources[0].notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Uncertainty */}
                {change.evidenceChain.uncertainties[0] && (
                  <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-[11px]">
                    <span className="font-bold">What Remains Contingent: </span>
                    {change.evidenceChain.uncertainties[0]}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-4 sm:px-5">
        <span>Suggested action: &ldquo;{change.suggestedActionItem.title}&rdquo;</span>
        <button
          type="button"
          onClick={handleAddToActionPlan}
          disabled={isSaved}
          className={`font-semibold transition-colors ${
            isSaved
              ? "text-emerald-600 dark:text-emerald-400 cursor-default"
              : "text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
          }`}
        >
          {isSaved ? "Saved to Plan" : "Add to Plan"}
        </button>
      </div>
    </div>
  );
};
