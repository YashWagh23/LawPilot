"use client";

import React, { useState, useMemo } from "react";
import type { ActionPlan, ActionPlanItem, ActionPriority, ActionItemType } from "@/types";

interface ActionPlanProps {
  actionPlan: ActionPlan;
  onSelectFinding?: (findingId: string) => void;
  onNavigateToBrief?: () => void;
}

type FilterCategory =
  | "all"
  | "urgent"
  | "before_signing"
  | "questions"
  | "documents"
  | "facts"
  | "triggers"
  | "followup";

export const ActionPlanView: React.FC<ActionPlanProps> = ({
  actionPlan,
  onSelectFinding,
  onNavigateToBrief,
}) => {
  const storageKey = `lawpilot_action_progress_${actionPlan.documentId || actionPlan.id}`;

  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore localStorage errors in private mode
    }
    return {};
  });
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist completed state to localStorage
  const toggleItem = (itemId: string) => {
    setCompletedMap((prev) => {
      const updated = { ...prev, [itemId]: !prev[itemId] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Aggregate all action items for calculations
  const allActionItems = useMemo(() => {
    const list: (ActionPlanItem & { categoryGroup: string })[] = [];
    actionPlan.urgentItems.forEach((item) => list.push({ ...item, categoryGroup: "urgent" }));
    actionPlan.beforeSigning.forEach((item) => list.push({ ...item, categoryGroup: "before_signing" }));
    actionPlan.questionsToAsk.forEach((item) => list.push({ ...item, categoryGroup: "questions" }));
    actionPlan.documentsToCollect.forEach((item) => list.push({ ...item, categoryGroup: "documents" }));
    actionPlan.factsToConfirm.forEach((item) => list.push({ ...item, categoryGroup: "facts" }));
    actionPlan.followUpItems.forEach((item) => list.push({ ...item, categoryGroup: "followup" }));
    return list;
  }, [actionPlan]);

  const totalActionsCount = allActionItems.length;
  const completedCount = allActionItems.filter((item) => completedMap[item.id]).length;
  const progressPercent =
    totalActionsCount > 0 ? Math.round((completedCount / totalActionsCount) * 100) : 0;

  // Filter items by category & search
  const filteredItems = useMemo(() => {
    return allActionItems.filter((item) => {
      if (activeCategory !== "all" && item.categoryGroup !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.explanation.toLowerCase().includes(query) ||
          (item.practicalAdvice && item.practicalAdvice.toLowerCase().includes(query)) ||
          (item.findingTitle && item.findingTitle.toLowerCase().includes(query)) ||
          (item.clauseSection && item.clauseSection.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [allActionItems, activeCategory, searchQuery]);

  // Export checklist as formatted Markdown
  const copyAsMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# LawPilot Action Plan Checklist`);
    lines.push(`**Generated:** ${new Date(actionPlan.generatedAt).toLocaleDateString()}`);
    lines.push(`**Summary:** ${actionPlan.summary}`);
    lines.push(`**Progress:** ${completedCount}/${totalActionsCount} completed (${progressPercent}%)\n`);

    const sections = [
      { title: "🚨 DO NOW (Urgent Items)", items: actionPlan.urgentItems },
      { title: "📝 BEFORE SIGNING", items: actionPlan.beforeSigning },
      { title: "💬 QUESTIONS TO ASK", items: actionPlan.questionsToAsk },
      { title: "📁 DOCUMENTS TO COLLECT", items: actionPlan.documentsToCollect },
      { title: "🔍 FACTS TO CONFIRM", items: actionPlan.factsToConfirm },
      { title: "📅 TIMELINE & FOLLOW-UP", items: actionPlan.followUpItems },
    ];

    sections.forEach(({ title, items }) => {
      if (items.length > 0) {
        lines.push(`\n## ${title}`);
        items.forEach((item) => {
          const checked = completedMap[item.id] ? "[x]" : "[ ]";
          lines.push(`- ${checked} **[${item.priority.toUpperCase()}]** ${item.title}`);
          lines.push(`  *${item.explanation}*`);
          if (item.practicalAdvice) {
            lines.push(`  > Advice: ${item.practicalAdvice}`);
          }
          if (item.clauseSection) {
            lines.push(`  *Reference: ${item.clauseSection}${item.pageNumber ? ` (p. ${item.pageNumber})` : ""}*`);
          }
        });
      }
    });

    if (actionPlan.professionalReviewTriggers.length > 0) {
      lines.push(`\n## ⚖️ WHEN TO SEEK PROFESSIONAL REVIEW`);
      actionPlan.professionalReviewTriggers.forEach((t) => {
        lines.push(`- **[${t.severity.toUpperCase().replace("_", " ")}] ${t.clauseSection}**: ${t.reason}`);
      });
    }

    navigator.clipboard.writeText(lines.join("\n"));
    showToast("Action checklist copied to clipboard as Markdown!");
  };

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Script copied to clipboard!");
  };

  const getPriorityStyle = (priority: ActionPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "important":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "recommended":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "optional":
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getTypeBadge = (type: ActionItemType) => {
    const labels: Record<ActionItemType, { label: string; icon: string }> = {
      ask_party: { label: "Ask Drafting Party", icon: "💬" },
      clarify: { label: "Clarify Term", icon: "✏️" },
      collect_document: { label: "Collect Document", icon: "📁" },
      confirm_fact: { label: "Confirm Fact", icon: "🔍" },
      compare_version: { label: "Compare Version", icon: "📑" },
      seek_professional_review: { label: "Seek Attorney Review", icon: "⚖️" },
      monitor_deadline: { label: "Monitor Deadline", icon: "⏱️" },
      preserve_evidence: { label: "Preserve Evidence", icon: "🛡️" },
      general_preparation: { label: "Preparation", icon: "📋" },
    };
    return labels[type] || { label: type, icon: "📌" };
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-950 border border-emerald-500/50 text-emerald-200 rounded-lg shadow-xl shadow-black/50 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* ACT Layer Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ACT LAYER
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Understand • Verify • <strong className="text-indigo-300">Act</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Action Plan & Preparation Checklist
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {actionPlan.summary}
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyAsMarkdown}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-2 shadow-sm"
              title="Copy checklist as Markdown"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Checklist (MD)
            </button>

            {onNavigateToBrief && (
              <button
                onClick={onNavigateToBrief}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
              >
                <span>View Lawyer Brief</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">
              Overall Preparation Readiness:{" "}
              <span className="text-white font-semibold">
                {completedCount} of {totalActionsCount} completed
              </span>
            </span>
            <span className="font-bold text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Navigation & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeCategory === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All Items ({allActionItems.length})
          </button>
          <button
            onClick={() => setActiveCategory("urgent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === "urgent"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "bg-slate-900/80 text-rose-400 hover:text-rose-300 border border-slate-800"
            }`}
          >
            <span>🚨 Do Now</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-[10px]">
              {actionPlan.urgentItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory("before_signing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === "before_signing"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>📝 Before Signing</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
              {actionPlan.beforeSigning.length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory("questions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === "questions"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>💬 Questions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
              {actionPlan.questionsToAsk.length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory("documents")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === "documents"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>📁 Collect</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
              {actionPlan.documentsToCollect.length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory("facts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === "facts"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>🔍 Confirm Facts</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
              {actionPlan.factsToConfirm.length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory("triggers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === "triggers"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "bg-slate-900/80 text-amber-400 hover:text-amber-300 border border-slate-800"
            }`}
          >
            <span>⚖️ Seek Counsel</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px]">
              {actionPlan.professionalReviewTriggers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory("followup")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === "followup"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>📅 Milestones</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
              {actionPlan.followUpItems.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actions or clauses..."
            className="w-full px-3.5 py-1.5 pl-9 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3 top-2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Professional Review Triggers Banner (Shown on 'all' or 'triggers') */}
      {(activeCategory === "all" || activeCategory === "triggers") &&
        actionPlan.professionalReviewTriggers.length > 0 && (
          <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚖️</span>
                <h3 className="text-sm font-semibold text-amber-200">
                  When to Seek Professional Attorney Review
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {actionPlan.professionalReviewTriggers.length} High-Attention Triggers
              </span>
            </div>
            <p className="text-xs text-slate-300">
              LawPilot identified the following high-risk or statutory uncertainty triggers where consultation with qualified legal counsel is strongly recommended:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {actionPlan.professionalReviewTriggers.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg bg-slate-900/90 border border-amber-500/20 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-amber-400">{t.clauseSection}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase">
                      {t.severity.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{t.reason}</p>
                  {onSelectFinding && (
                    <button
                      onClick={() => onSelectFinding(t.findingId)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium pt-1 block"
                    >
                      View Linked Finding & Evidence →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Action Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-sm">
            <p>No action items match your current filter.</p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
              className="mt-2 text-indigo-400 hover:underline text-xs"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleted = !!completedMap[item.id];
            const typeInfo = getTypeBadge(item.actionType);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isCompleted
                    ? "bg-slate-900/40 border-slate-800/60 opacity-75"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Completion Checkbox */}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition ${
                      isCompleted
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-slate-800/80 border-slate-700 hover:border-slate-500 text-transparent"
                    }`}
                    title={isCompleted ? "Mark as pending" : "Mark as completed"}
                  >
                    <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>

                  {/* Main Item Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header Row: Title & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${getPriorityStyle(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1">
                          <span>{typeInfo.icon}</span>
                          <span>{typeInfo.label}</span>
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          🛡️ Reversible Preparation
                        </span>
                      </div>

                      {/* Finding & Clause Link */}
                      {item.clauseSection && (
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          {item.findingId && onSelectFinding ? (
                            <button
                              onClick={() => onSelectFinding(item.findingId!)}
                              className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center gap-1"
                            >
                              <span>{item.clauseSection}</span>
                              {item.pageNumber && <span>(p. {item.pageNumber})</span>}
                              <span>↗</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">
                              {item.clauseSection} {item.pageNumber && `(p. ${item.pageNumber})`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Title & Explanation */}
                    <div>
                      <h4
                        className={`text-sm font-semibold transition ${
                          isCompleted ? "text-slate-400 line-through" : "text-white"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>

                    {/* Practical Advice / Script Callout */}
                    {item.practicalAdvice && (
                      <div className="mt-2.5 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200/90 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5 font-bold">💡 Advice:</span>
                          <span className="leading-relaxed">{item.practicalAdvice}</span>
                        </div>
                        <button
                          onClick={() => copySnippet(item.practicalAdvice!)}
                          className="px-2 py-1 rounded bg-indigo-900/50 hover:bg-indigo-800/50 text-indigo-300 text-[11px] font-medium border border-indigo-500/30 transition shrink-0 whitespace-nowrap"
                          title="Copy script to clipboard"
                        >
                          Copy Script
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
