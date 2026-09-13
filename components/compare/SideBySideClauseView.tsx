"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  CheckSquare,
  Scale,
  Clock,
  DollarSign,
  Briefcase,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  ClauseComparisonItem,
  ImpactCategory,
} from "@/types";
import { addCompareActionItem } from "@/lib/comparison/compareActionStore";

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
  const [hasAddedAction, setHasAddedAction] = useState(false);
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(true);

  const handleAddToActionPlan = () => {
    addCompareActionItem(change.suggestedActionItem);
    setHasAddedAction(true);
    onActionAdded?.(change.suggestedActionItem.title);
    setTimeout(() => setHasAddedAction(false), 3000);
  };

  const renderImpactIcon = (cat: ImpactCategory) => {
    switch (cat) {
      case "financial":
        return <DollarSign className="w-3.5 h-3.5 text-emerald-500" />;
      case "timing":
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case "legal":
        return <Scale className="w-3.5 h-3.5 text-amber-500" />;
      case "operational":
        return <Briefcase className="w-3.5 h-3.5 text-purple-500" />;
      case "scope":
      default:
        return <Layers className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden space-y-6">
      {/* Clause Detail Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                {change.category.replace("_", " ")}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {change.previousSection && change.currentSection && change.previousSection !== change.currentSection
                  ? `${change.previousSection} → ${change.currentSection}`
                  : change.currentSection || change.previousSection}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {change.clauseTitle}
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddToActionPlan}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                hasAddedAction
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
              }`}
            >
              {hasAddedAction ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Added to Plan!</span>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask LawPilot</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* SIDE-BY-SIDE VIEW */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Side-by-Side Clause Language
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* PREVIOUS VERSION */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  PREVIOUS VERSION
                </span>
                <span className="text-[10px] font-sans font-mono text-slate-500">
                  {change.previousSection || "Omitted"}
                </span>
              </div>
              <p className="leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {change.whatChanged.original}
              </p>
            </div>

            {/* CURRENT VERSION */}
            <div
              className={`rounded-xl border p-4 space-y-2 ${
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
              <p className="leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                {change.whatChanged.revised}
              </p>
            </div>
          </div>
        </div>

        {/* Granular Semantic Diff Details */}
        {change.semanticDetails && change.semanticDetails.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Specific Parameter Adjustments
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {change.semanticDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs flex flex-col justify-between"
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {detail.parameter}
                  </span>
                  <div className="mt-1 font-mono text-xs">
                    <span className="text-slate-500 line-through mr-1.5">
                      {detail.previousValue}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      → {detail.currentValue}
                    </span>
                  </div>
                  <span className="mt-1 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    {detail.changeSummary}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* "CHANGE IMPACT" PANEL */}
        {change.impacts && change.impacts.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              CHANGE IMPACT
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {change.impacts.map((impact, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white capitalize">
                    {renderImpactIcon(impact.category)}
                    <span>{impact.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {impact.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* "WHY THIS MATTERS" PANEL (Signature UX Differentiator) */}
        <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              WHY THIS MATTERS
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-semibold">
              Practical & Financial Exposure
            </span>
          </div>

          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {change.whyItMatters}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60">
            {/* WHAT TO VERIFY */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                WHAT TO VERIFY
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {change.whatToVerify.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WHAT TO ASK */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                WHAT TO ASK
              </span>
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
                &ldquo;{change.whatToAsk}&rdquo;
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Calibrated inquiry phrasing ready to send in writing to HR or counterparty counsel.
              </p>
            </div>
          </div>
        </div>

        {/* LEGAL CONTEXT & EVIDENCE CHAIN ACCORDION */}
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
                  Verified Legal Context & Statutory Authority
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                  Evidence Verified
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
                    Legal Finding & Interpretation
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

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Reversible preparation item: &ldquo;{change.suggestedActionItem.title}&rdquo;
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleAddToActionPlan}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{hasAddedAction ? "Added to Action Plan" : "Add to Action Plan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
