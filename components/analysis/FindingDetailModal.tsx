"use client";

import React, { useEffect, useRef } from "react";
import type { FindingPresentation } from "@/lib/analysis/presentationTransformer";
import {
  X,
  ArrowRight,
  Eye,
  Sparkles,
} from "lucide-react";

interface FindingDetailModalProps {
  finding: FindingPresentation | null;
  isOpen: boolean;
  onClose: () => void;
  onJumpToClause?: (clauseId: string) => void;
  onAskLawPilot?: (question: string) => void;
  onViewEvidenceChain?: (chain: FindingPresentation["evidenceChain"]) => void;
}

export function FindingDetailModal({
  finding,
  isOpen,
  onClose,
  onJumpToClause,
  onAskLawPilot,
  onViewEvidenceChain,
}: FindingDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard Escape listener & focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Move focus into modal when it opens (focus trap entry point)
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !finding) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs lp-animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden lp-animate-scale-in focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  finding.severityLabel === "HIGH"
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                    : finding.severityLabel === "MEDIUM"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                }`}
              >
                {finding.severityLabel}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {finding.clauseReference}
              </span>
            </div>
            <h2
              id="finding-modal-title"
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug"
            >
              {finding.title}
            </h2>
            {finding.keyValue && (
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {finding.keyValue}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body — Open whitespace, no nested cards */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Section 1: Why We Flagged This */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Why we flagged this
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed lp-text-pretty">
              {finding.whyWeFlagged}
            </p>
          </div>

          {/* Section 2: What the Contract Says */}
          <div className="pt-5 space-y-2">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              What the contract says
            </p>
            <blockquote className="lp-quote">
              &ldquo;{finding.whatContractSays}&rdquo;
            </blockquote>
          </div>

          {/* Section 3: Why It May Matter */}
          <div className="pt-5 space-y-2">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Why it may matter
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed lp-text-pretty">
              {finding.whyItMayMatter}
            </p>
          </div>

          {/* Section 4: What to Verify */}
          {finding.whatToVerify.length > 0 && (
            <div className="pt-5 space-y-2">
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                What to verify
              </p>
              <ul className="space-y-1.5">
                {finding.whatToVerify.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 mt-0.5">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 5: What to Do Next */}
          {finding.whatToDoNext.length > 0 && (
            <div className="pt-5 space-y-2">
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                What to do next
              </p>
              <ul className="space-y-1.5">
                {finding.whatToDoNext.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-500 mt-0.5">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center justify-center sm:justify-start">
            {finding.evidenceChain && onViewEvidenceChain && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewEvidenceChain(finding.evidenceChain);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer min-h-[36px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View Full Evidence</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
            {onAskLawPilot && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAskLawPilot(`Can you explain the clause "${finding.title}" in simple terms and what I should negotiate?`);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer min-h-[44px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ask LawPilot</span>
              </button>
            )}

            {onJumpToClause && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onJumpToClause(finding.clauseId);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-xs min-h-[44px]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View in Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
