"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { ActionPlan, ActionPlanItem } from "@/types";
import { toSimpleActionPresentation, SimpleActionItem } from "@/lib/analysis/presentationTransformer";
import {
  getCompareActionItems,
  removeCompareActionItem,
  toggleCompareActionItemCompleted,
  COMPARE_ACTION_EVENT,
} from "@/lib/comparison/compareActionStore";
import {
  removeNegotiationDraft,
  useSavedNegotiationDrafts,
} from "@/lib/negotiation/negotiationStore";
import {
  Check,
  ChevronDown,
  Copy,
  Briefcase,
  GitCompare,
  Handshake,
  X,
} from "lucide-react";

interface ActionPlanProps {
  actionPlan: ActionPlan;
  /** Document whose saved Negotiation Copilot drafts should appear as steps. */
  documentId?: string;
  onSelectFinding?: (findingId: string) => void;
  onNavigateToBrief?: () => void;
}

export const ActionPlanView: React.FC<ActionPlanProps> = ({
  actionPlan,
  documentId,
  onSelectFinding: _onSelectFinding,
  onNavigateToBrief,
}) => {
  const storageKey = `lawpilot_action_progress_${actionPlan.documentId || actionPlan.id}`;

  // 1. Comparison-derived items from compareActionStore
  const [compareItems, setCompareItems] = useState<ActionPlanItem[]>(() => {
    return getCompareActionItems();
  });

  // Keep compare items synchronized if added/removed across components or tabs
  useEffect(() => {
    const syncCompare = () => {
      setCompareItems(getCompareActionItems());
    };
    window.addEventListener(COMPARE_ACTION_EVENT, syncCompare);
    window.addEventListener("storage", syncCompare);
    return () => {
      window.removeEventListener(COMPARE_ACTION_EVENT, syncCompare);
      window.removeEventListener("storage", syncCompare);
    };
  }, []);

  // 2. Drafts saved from the Negotiation Copilot for this document
  const negotiationDrafts = useSavedNegotiationDrafts(documentId || actionPlan.documentId);

  // 3. Report-derived items from transformer
  const baseReportItems = useMemo(() => {
    return toSimpleActionPresentation(actionPlan);
  }, [actionPlan]);

  // 4. Unified action items: report items + negotiation drafts + comparison items, deduplicated deterministically
  const simpleItems = useMemo(() => {
    const seenTitles = new Set<string>();
    const seenIds = new Set<string>();
    const unified: SimpleActionItem[] = [];

    // Add base report items first (preserves existing report action items exactly)
    for (const item of baseReportItems) {
      if (!item || !item.id) continue;
      seenIds.add(item.id);
      seenTitles.add(item.title.toLowerCase().trim());
      unified.push(item);
    }

    // Negotiation drafts saved by the user — one step per finding
    for (const draft of negotiationDrafts) {
      if (!draft?.id || seenIds.has(draft.id)) continue;
      seenIds.add(draft.id);
      unified.push({
        id: draft.id,
        number: unified.length + 1,
        title: `Negotiate ${draft.clauseSection}: ${draft.findingTitle}`,
        whyRecommended: draft.issueExplanation,
        clauseReference: draft.pageNumber ? `${draft.clauseSection} · Page ${draft.pageNumber}` : draft.clauseSection,
        findingTitle: draft.findingTitle,
        priority: draft.severity === "critical_attention" || draft.severity === "high_attention" ? "urgent" : "important",
        negotiation: draft,
      });
    }

    // Append comparison items if not already present
    for (const cItem of compareItems) {
      if (!cItem || !cItem.id) continue;
      const normalizedTitle = (cItem.title || "").toLowerCase().trim();
      if (seenIds.has(cItem.id) || seenTitles.has(normalizedTitle)) {
        continue;
      }
      seenIds.add(cItem.id);
      seenTitles.add(normalizedTitle);

      unified.push({
        id: cItem.id,
        number: unified.length + 1,
        title: cItem.title,
        whyRecommended: cItem.explanation || "Clarification recommended based on document comparison delta.",
        practicalAdvice: cItem.practicalAdvice,
        clauseReference: cItem.clauseSection ? `From Comparison · ${cItem.clauseSection}` : "From Comparison",
        findingTitle: undefined,
        priority: cItem.priority === "urgent" ? "urgent" : cItem.priority === "important" ? "important" : "recommended",
        isFromCompare: true,
      });
    }

    // Renumber sequentially 1..N
    return unified.map((item, idx) => ({
      ...item,
      number: idx + 1,
    }));
  }, [baseReportItems, negotiationDrafts, compareItems]);

  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (typeof window === "undefined") return initial;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        Object.assign(initial, JSON.parse(saved));
      }
    } catch {
      // Storage parse fail
    }
    // Also merge comparison store completion states if present
    try {
      const cItems = getCompareActionItems();
      for (const ci of cItems) {
        if (ci.completed && initial[ci.id] === undefined) {
          initial[ci.id] = true;
        }
      }
    } catch {
      // Storage read fail
    }
    return initial;
  });

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  const toggleCheck = (id: string) => {
    setCompletedMap((prev) => {
      const nextStatus = !prev[id];
      const updated = { ...prev, [id]: nextStatus };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // Storage write fail
        }
        // If this is a compare item, also update completion in compare store
        try {
          toggleCompareActionItemCompleted(id, nextStatus);
        } catch {
          // Ignore
        }
      }
      return updated;
    });
  };

  const handleRemoveCompareItem = (id: string) => {
    removeCompareActionItem(id);
    setCompareItems((prev) => prev.filter((item) => item.id !== id));
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
          }${
            item.negotiation
              ? `\n   Draft clause (for review, not legal advice): "${item.negotiation.proposedClause}"\n   Fallback: ${item.negotiation.fallbackPosition}`
              : ""
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
                  <div className="flex items-start justify-between gap-2">
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

                    {item.negotiation && (
                      <button
                        type="button"
                        onClick={() => removeNegotiationDraft(item.negotiation!.documentId, item.negotiation!.findingId)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        aria-label={`Remove "${item.title}" from Action Plan`}
                        title="Remove negotiation draft from Next Steps"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {item.isFromCompare && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCompareItem(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        aria-label={`Remove "${item.title}" from Action Plan`}
                        title="Remove comparison item from Action Plan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {item.isFromCompare && (
                    <div className="pt-0.5 pb-0.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                        <GitCompare className="w-3 h-3" />
                        <span>Added from Comparison</span>
                        {item.clauseReference && (
                          <span className="font-mono text-[9px] text-indigo-500 dark:text-indigo-400">
                            · {item.clauseReference}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {item.negotiation && (
                    <div className="pt-0.5 pb-0.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                        <Handshake className="w-3 h-3" aria-hidden="true" />
                        <span>Negotiation Copilot draft</span>
                        {item.clauseReference && (
                          <span className="font-mono text-[9px] text-indigo-600 dark:text-indigo-400">
                            · {item.clauseReference}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

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

                      {item.negotiation && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
                              Suggested clause · draft for review
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyScript(
                                  item.id,
                                  `Subject: ${item.negotiation!.message.subject}\n\n${item.negotiation!.message.body}`
                                )
                              }
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                            >
                              {copiedScriptId === item.id ? "Copied!" : "Copy message"}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                            {item.negotiation.proposedClause}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            <span className="font-semibold">Fallback:</span> {item.negotiation.fallbackPosition}
                          </p>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400">
                            Not legal advice. Verify with a qualified lawyer before accepting any change.
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
