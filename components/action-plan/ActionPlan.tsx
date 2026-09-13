"use client";

import React, { useState, useMemo } from "react";
import type { ActionPlan } from "@/types";
import { toSimpleActionPresentation } from "@/lib/analysis/presentationTransformer";
import {
  Check,
  ChevronDown,
  Copy,
  Briefcase,
} from "lucide-react";

interface ActionPlanProps {
  actionPlan: ActionPlan;
  onSelectFinding?: (findingId: string) => void;
  onNavigateToBrief?: () => void;
}

export const ActionPlanView: React.FC<ActionPlanProps> = ({
  actionPlan,
  onSelectFinding: _onSelectFinding,
  onNavigateToBrief,
}) => {
  const storageKey = `lawpilot_action_progress_${actionPlan.documentId || actionPlan.id}`;

  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Storage parse fail
    }
    return {};
  });

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  // Simplified action list
  const simpleItems = useMemo(() => {
    return toSimpleActionPresentation(actionPlan);
  }, [actionPlan]);

  const toggleCheck = (id: string) => {
    setCompletedMap((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // Storage write fail
        }
      }
      return updated;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyScript = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 2000);
  };

  const copyChecklist = () => {
    const text = simpleItems
      .map(
        (item) =>
          `${completedMap[item.id] ? "[x]" : "[ ]"} ${item.number}. ${item.title}\n   Why: ${item.whyRecommended}${
            item.practicalAdvice ? `\n   Script: "${item.practicalAdvice}"` : ""
          }`
      )
      .join("\n\n");

    navigator.clipboard.writeText(`LawPilot Action Plan:\n\n${text}`);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2500);
  };

  const completedCount = simpleItems.filter((i) => completedMap[i.id]).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Your Next Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Clear, practical actions to clarify ambiguities and protect your rights before signing.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copiedChecklist ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy List</span>
                </>
              )}
            </button>

            {onNavigateToBrief && (
              <button
                type="button"
                onClick={onNavigateToBrief}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
                <span>Prepare for a Lawyer</span>
              </button>
            )}
          </div>
        </div>

        {/* Minimal Progress Summary */}
        <div className="pt-2 text-xs text-slate-400">
          {completedCount} of {simpleItems.length} completed
        </div>
      </div>

      {/* Numbered Steps List */}
      <div className="space-y-3">
        {simpleItems.map((item) => {
          const isDone = !!completedMap[item.id];
          const isExpanded = !!expandedItems[item.id];

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isDone
                  ? "bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-80"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Checkbox with comfortable touch target */}
                <button
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className="min-h-[44px] min-w-[44px] -ml-2 -mt-2 flex items-center justify-center cursor-pointer shrink-0"
                  aria-label={`Mark "${item.title}" as ${isDone ? "incomplete" : "completed"}`}
                >
                  <span
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 dark:border-slate-600 hover:border-indigo-500"
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                </button>

                {/* Step Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {item.number}.
                    </span>
                    <h3
                      className={`text-sm font-bold leading-snug ${
                        isDone
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>

                  {/* Progressive Disclosure Link */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5 cursor-pointer min-h-[36px]"
                  >
                    <span>{isExpanded ? "Hide details" : "Why this is recommended"}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 text-xs lp-animate-slide-down">
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.whyRecommended}
                      </p>

                      {item.practicalAdvice && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
                              Suggested Discussion Script
                            </span>
                            <button
                              type="button"
                              onClick={() => copyScript(item.id, item.practicalAdvice!)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              {copiedScriptId === item.id ? "Copied!" : "Copy script"}
                            </button>
                          </div>
                          <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed italic">
                            &ldquo;{item.practicalAdvice}&rdquo;
                          </p>
                        </div>
                      )}

                      {item.clauseReference && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          Reference: {item.clauseReference}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
