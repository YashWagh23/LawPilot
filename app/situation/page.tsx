"use client";

import React, { useState } from "react";
import {
  Sparkles,
  HelpCircle,
  FileQuestion,
  CheckSquare,
  Shield,
  Send,
  AlertTriangle,
  RotateCcw,
  Info,
  CheckCircle2,
} from "lucide-react";
import { SAMPLE_SITUATION_ASSESSMENT } from "@/lib/demo/sampleAnalysis";
import type { SituationAssessment } from "@/types";

type UIStatus = "IDLE" | "ANALYZING" | "SUCCESS" | "ERROR";

export default function SituationPage() {
  const [promptText, setPromptText] = useState("");
  const [activeAssessment, setActiveAssessment] = useState<SituationAssessment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<UIStatus>("IDLE");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSampleScenario = () => {
    setPromptText(SAMPLE_SITUATION_ASSESSMENT.userPrompt);
    setValidationError(null);
    setErrorMessage(null);
    setActiveAssessment(SAMPLE_SITUATION_ASSESSMENT);
    setStatus("SUCCESS");
  };

  const handleAnalyzeSituation = async () => {
    if (isProcessing) return;

    const trimmed = promptText.trim();
    if (!trimmed) {
      setValidationError("Describe what happened so LawPilot can identify the relevant issues.");
      return;
    }

    if (trimmed.length > 4000) {
      setValidationError(
        "Situation description exceeds 4,000 characters. Please provide a more concise factual description."
      );
      return;
    }

    setValidationError(null);
    setErrorMessage(null);
    setIsProcessing(true);
    setStatus("ANALYZING");

    try {
      const res = await fetch("/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situationText: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.assessment) {
        throw new Error(data.error || "We couldn't analyze this situation right now. Please try again.");
      }

      setActiveAssessment(data.assessment);
      setStatus("SUCCESS");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't analyze this situation right now. Please try again.";
      setErrorMessage(message);
      setStatus("ERROR");
    } finally {
      setIsProcessing(false);
    }
  };

  const isInsufficientInfo = activeAssessment?.identifiedCategory === "insufficient_information";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Intake Pathway 02
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300">·</span>
          <span className="text-xs text-slate-700 dark:text-slate-300">Situation Navigator</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Describe a Legal Situation
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          No contract uploaded yet? Narrate the key facts of a dispute, unpaid account, or agreement issue. LawPilot identifies the issue, pinpoints missing facts, and outlines practical next steps.
        </p>
      </div>

      {/* Input Form & Sample Loader */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label
            htmlFor="situation-facts"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            What happened? (Chronological facts, amounts, state/jurisdiction)
          </label>
          <button
            type="button"
            onClick={loadSampleScenario}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Scenario: Unpaid Freelance Invoice</span>
          </button>
        </div>

        <textarea
          id="situation-facts"
          rows={5}
          value={promptText}
          onChange={(e) => {
            setPromptText(e.target.value);
            if (validationError && e.target.value.trim()) {
              setValidationError(null);
            }
          }}
          placeholder="Example: I am an independent contractor in Texas. A client in California approved my deliverables 45 days ago but hasn't paid an invoice of $14,500. They're not answering calls or emails..."
          className={`w-full rounded-lg border p-3.5 text-sm text-slate-900 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-700 dark:placeholder:text-slate-300 focus:outline-hidden focus:ring-2 font-sans ${
            validationError
              ? "border-amber-400 bg-amber-50/20 focus:ring-amber-400 dark:border-amber-600"
              : "border-slate-300 bg-white dark:border-slate-700 focus:ring-indigo-500"
          }`}
        />

        {/* Validation Error Message */}
        {validationError && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200 animate-in fade-in duration-200"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <Shield className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
            <span>Not protected by attorney-client privilege. Do not submit sensitive trade secrets.</span>
          </div>

          <button
            type="button"
            id="navigate-situation-button"
            onClick={handleAnalyzeSituation}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Analyzing situation...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Navigate Situation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert with Try Again */}
      {status === "ERROR" && errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-900/50 dark:bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Analysis Unavailable
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {errorMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAnalyzeSituation}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Structured Assessment Output (if active) */}
      {activeAssessment && status !== "ANALYZING" && (
        <div className="space-y-6 pt-2">
          {/* Assessment Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Structured Assessment
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Preliminary Situation Assessment
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                  isInsufficientInfo
                    ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                }`}
              >
                {activeAssessment.identifiedCategory.toUpperCase().replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Disclaimer / Medical Notice if present */}
          {activeAssessment.disclaimer && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                {activeAssessment.disclaimer}
              </p>
            </div>
          )}

          {/* Insufficient Information Guidance Callout */}
          {isInsufficientInfo && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/30 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-semibold text-sm">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Not enough information yet</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                LawPilot does not have enough factual context to identify a legal controversy from that description alone. To identify whether any contractual terms or statutory rights are involved, answering the clarifying questions below will help.
              </p>
            </div>
          )}

          {/* STEP 1: WHAT HAPPENED */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-[10px] font-bold">
                1
              </span>
              <span>What Happened · Situation Summary</span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
              {activeAssessment.situationSummary || activeAssessment.userPrompt}
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-300">User description:</span>{" "}
              <span className="italic">&ldquo;{activeAssessment.userPrompt}&rdquo;</span>
            </div>
          </div>

          {/* STEP 2: WHAT THIS MAY INVOLVE (Legal Concepts if available) */}
          {activeAssessment.relevantLegalConcepts && activeAssessment.relevantLegalConcepts.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] font-bold">
                  2
                </span>
                <span>What This May Involve · Applicable Legal Concepts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeAssessment.relevantLegalConcepts.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-xs space-y-1.5"
                  >
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      {item.concept}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.plainEnglishExplanation}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 pt-1">
                      <strong>Caveat:</strong> {item.caveat}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: WHAT IS MISSING (Missing Facts & Questions to Clarify) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 px-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px] font-bold">
                3
              </span>
              <span>What Is Missing · Crucial Facts & Questions to Clarify</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Missing Facts */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Missing Facts Needed for Assessment</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Key details currently missing from your narrative:
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-700 dark:text-slate-300">
                  {activeAssessment.missingFacts.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>

              {/* Questions to Clarify */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                  <FileQuestion className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Questions to Clarify (Max 3)</span>
                </div>
                <div className="space-y-2.5">
                  {activeAssessment.followUpQuestions.slice(0, 3).map((q) => (
                    <div
                      key={q.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {q.question}
                      </p>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                        <strong>Why it matters:</strong> {q.whyItMatters}
                      </p>
                      {q.answer && (
                        <p className="mt-1 font-mono text-[11px] text-indigo-700 dark:text-indigo-400">
                          Recorded: &ldquo;{q.answer}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: WHAT TO DO NEXT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] font-bold">
                  4
                </span>
                <span>What to Do Next · Practical & Reversible Steps</span>
              </div>
              <span className="text-[11px] text-slate-700 dark:text-slate-300 hidden sm:inline">
                Rule: Prioritize reversible steps
              </span>
            </div>

            {/* Possible Practical Paths */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAssessment.possibleOptions.slice(0, 3).map((opt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                        Step 0{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                          opt.reversibility === "high"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : opt.reversibility === "moderate"
                            ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {opt.reversibility.toUpperCase()} REVERSIBILITY
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {opt.title}
                    </h4>

                    {opt.pros && opt.pros.length > 0 && (
                      <div className="mt-2.5 space-y-1">
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Advantages:
                        </span>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-0.5">
                          {opt.pros.map((pro, pIdx) => (
                            <li key={pIdx}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {opt.risks && opt.risks.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        Considerations:
                      </span>
                      <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-0.5">
                        {opt.risks.map((risk, rIdx) => (
                          <li key={rIdx}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Evidence & Counsel Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {activeAssessment.evidenceToCollect && activeAssessment.evidenceToCollect.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Evidence to Secure Now</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {activeAssessment.evidenceToCollect.map((ev, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeAssessment.questionsForLawyer && activeAssessment.questionsForLawyer.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Questions for Licensed Legal Counsel</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {activeAssessment.questionsForLawyer.map((ql, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>&ldquo;{ql}&rdquo;</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
