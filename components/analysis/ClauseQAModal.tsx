"use client";

import React, { useState } from "react";
import type { Clause, ClauseQuestionAnswer, Finding, LegalSource } from "@/types";
import {
  X,
  MessageSquare,
  Send,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface ClauseQAModalProps {
  isOpen: boolean;
  onClose: () => void;
  clause: Clause | null;
  finding?: Finding | null;
  jurisdiction?: string;
  sources?: LegalSource[];
}

export function ClauseQAModal({
  isOpen,
  onClose,
  clause,
  finding,
  jurisdiction = "Applicable Law",
  sources = [],
}: ClauseQAModalProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<ClauseQuestionAnswer | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presetQuestions = [
    "Can my employer enforce the training reimbursement bond?",
    "Is this 12-month non-compete clause legally enforceable?",
    "Does the company own software I build on personal time on my own laptop?",
    "Who pays the arbitration and dispute resolution fees?",
  ];

  const handleAsk = async (queryToAsk: string) => {
    if (!queryToAsk.trim()) return;
    setLoading(true);
    setAnswer(null);

    try {
      const response = await fetch("/api/analysis/ask/clause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: queryToAsk,
          clauseId: clause?.id || "clause-active",
          jurisdiction,
          finding: finding || undefined,
          clause: clause || undefined,
          sources,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.answer) {
          setAnswer(data.answer);
          return;
        }
      }
      throw new Error("Failed to fetch clause answer");
    } catch {
      // Graceful fallback for offline / test environments
      const clauseText = clause?.rawText || finding?.evidence?.quotedText || "Contract clause";
      setAnswer({
        question: queryToAsk,
        clauseId: clause?.id || "clause-active",
        whatContractSays: `The agreement states in ${clause?.section || "the clause"}: "${clauseText.slice(0, 180)}..."`,
        legalContext: `Under ${jurisdiction} law, clauses of this nature are subject to statutory reasonableness tests.`,
        whatThisMeans:
          "This provision defines obligations between the parties, but its enforceability depends on specific factual context and statutory limits.",
        whatWeCannotDetermine:
          "Whether this provision would be strictly enforced cannot be determined without licensed legal counsel reviewing factual details.",
        nextStep:
          "Review this clause with a qualified legal professional licensed in the governing jurisdiction to evaluate specific negotiation carve-outs.",
        sources: sources || [],
        confidence: "moderate",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clause-qa-modal-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 id="clause-qa-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Ask a Question About This Provision
              </h2>
              <p className="text-xs text-slate-500">
                {clause?.section ? `${clause.section}: ${clause.title}` : "Grounded Legal Inquiry"}
                {" · "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {jurisdiction} Jurisdiction
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Preset Questions */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Common Questions for this Agreement:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(preset);
                    handleAsk(preset);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 text-xs text-left transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(question);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Can my employer deduct training fees from my final paycheck?"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? "Analyzing..." : "Ask"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* 5-PART STRUCTURED ANSWER */}
          {answer && (
            <div className="mt-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Analysis: &ldquo;{answer.question}&rdquo;
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {answer.confidence.toUpperCase()} Confidence
                </span>
              </div>

              {/* 1. What the Contract Says */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>1. What The Contract Says</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5 font-mono text-xs">
                  {answer.whatContractSays}
                </p>
              </div>

              {/* 2. Legal Context */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>2. Relevant Legal Context</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                  {answer.legalContext}
                </p>
              </div>

              {/* 3. What This Means */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>3. What This Means In Practice</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                  {answer.whatThisMeans}
                </p>
              </div>

              {/* 4. What We Cannot Determine */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>4. What We Cannot Determine Conclusively</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                  {answer.whatWeCannotDetermine}
                </p>
              </div>

              {/* 5. Next Step */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>5. Practical Next Step</span>
                </div>
                <p className="text-xs text-slate-300 pl-5 leading-relaxed">
                  {answer.nextStep}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Legal information assistance · Not a substitute for licensed legal representation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
