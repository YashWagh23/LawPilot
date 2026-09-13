"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Scale,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { AskAnswerStructure } from "@/types/ask";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";

interface CompareAskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion: string;
  clauseTitle: string;
  documentId?: string;
}

interface ModalContentProps {
  initialQuestion: string;
  clauseTitle: string;
  documentId: string;
  onClose: () => void;
}

const CompareAskModalContent: React.FC<ModalContentProps> = ({
  initialQuestion,
  clauseTitle,
  documentId,
  onClose,
}) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [isLoading, setIsLoading] = useState(true);
  const [answer, setAnswer] = useState<AskAnswerStructure | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchInitialAnswer() {
      try {
        const res = await fetch("/api/analysis/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            question: initialQuestion,
            clientReport: SAMPLE_ANALYSIS_REPORT,
          }),
        });

        const data = await res.json();
        if (!isMounted) return;

        const structured = data.answer || data.message?.structuredAnswer;
        if (data.success && structured) {
          setAnswer(structured);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("Unable to process answer at this time.");
        }
      } catch {
        if (isMounted) {
          setError("Network or server connection error.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchInitialAnswer();

    return () => {
      isMounted = false;
    };
  }, [documentId, initialQuestion]);

  const handleManualSubmit = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analysis/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          question: question.trim(),
          clientReport: SAMPLE_ANALYSIS_REPORT,
        }),
      });

      const data = await res.json();
      const structured = data.answer || data.message?.structuredAnswer;
      if (data.success && structured) {
        setAnswer(structured);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Unable to process answer at this time.");
      }
    } catch {
      setError("Network or server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-ask-modal-title"
      className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="compare-ask-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Ask LawPilot
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                Grounded Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Inquiring regarding: {clauseTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto flex-1 space-y-4">
        {/* Question Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Your Legal Question
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  void handleManualSubmit();
                }
              }}
              className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="Ask a question about this clause change..."
            />
            <button
              type="button"
              onClick={() => void handleManualSubmit()}
              disabled={isLoading || !question.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Evaluating statutory context and verified Indian precedents...
            </p>
          </div>
        )}

        {/* Answer Card */}
        {answer && !isLoading && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 space-y-4">
            {/* Main Answer */}
            <p className="text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed font-medium">
              {answer.answer}
            </p>

            {/* Document Evidence */}
            {answer.whatDocumentSays && (
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                  <FileText className="w-3.5 h-3.5" />
                  <span>What The Contract Says</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                  {answer.whatDocumentSays}
                </p>
              </div>
            )}

            {/* Legal Context */}
            {answer.legalContext && (
              <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Statutory Legal Framework</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {answer.legalContext}
                </p>
              </div>
            )}

            {/* Uncertainty */}
            {answer.whatIsUncertain && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                <span className="font-bold">Contingent Factors: </span>
                {answer.whatIsUncertain}
              </div>
            )}

            {/* Practical Next Step */}
            {answer.whatToDoNext && (
              <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Recommended Preparation Step</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  {answer.whatToDoNext}
                </p>
              </div>
            )}

            {/* Sources */}
            {answer.sources && answer.sources.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Verified Legal Authorities
                </span>
                <div className="space-y-1">
                  {answer.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {src.citation}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 capitalize">
                        {src.sourceType.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const CompareAskModal: React.FC<CompareAskModalProps> = ({
  isOpen,
  onClose,
  initialQuestion,
  clauseTitle,
  documentId = "demo-employment-agreement",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <CompareAskModalContent
        key={`${isOpen}-${initialQuestion}`}
        initialQuestion={initialQuestion}
        clauseTitle={clauseTitle}
        documentId={documentId}
        onClose={onClose}
      />
    </div>
  );
};
