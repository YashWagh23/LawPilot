"use client";

import React, { useState } from "react";
import {
  Compass,
  Sparkles,
  HelpCircle,
  FileQuestion,
  BookOpen,
  CheckSquare,
  Shield,
  Send,
  AlertTriangle,
} from "lucide-react";
import { SAMPLE_SITUATION_ASSESSMENT } from "@/lib/demo/sampleAnalysis";
import type { SituationAssessment } from "@/types";

export default function SituationPage() {
  const [promptText, setPromptText] = useState("");
  const [activeAssessment, setActiveAssessment] = useState<SituationAssessment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSampleScenario = () => {
    setPromptText(SAMPLE_SITUATION_ASSESSMENT.userPrompt);
    setActiveAssessment(SAMPLE_SITUATION_ASSESSMENT);
  };

  const handleAnalyzeSituation = () => {
    if (!promptText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setActiveAssessment(SAMPLE_SITUATION_ASSESSMENT);
      setIsProcessing(false);
    }, 800);
  };

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
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Example: I am an independent contractor in Texas. A client in California approved my deliverables 45 days ago but hasn't paid an invoice of $14,500. They're not answering calls or emails..."
          className="w-full rounded-lg border border-slate-300 bg-white p-3.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-700 dark:placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <Shield className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
            <span>Not protected by attorney-client privilege. Do not submit sensitive trade secrets.</span>
          </div>

          <button
            type="button"
            onClick={handleAnalyzeSituation}
            disabled={!promptText.trim() || isProcessing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Evaluating Facts...</span>
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

      {/* Structured Assessment Output (if active) */}
      {activeAssessment && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Structured Advisory Breakdown
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Preliminary Situation Assessment
              </h2>
            </div>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
              {activeAssessment.identifiedCategory.toUpperCase().replace(/_/g, " ")}
            </span>
          </div>

          {/* Grid: Missing Facts & Follow-up Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Missing Facts */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Identified Missing Facts (Crucial for Counsel)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Before consulting an attorney, verify these factual gaps to avoid unnecessary legal expense:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-700 dark:text-slate-300">
                {activeAssessment.missingFacts.map((fact, idx) => (
                  <li key={idx}>{fact}</li>
                ))}
              </ul>
            </div>

            {/* Follow-up Questions */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <FileQuestion className="w-4 h-4 text-indigo-500" />
                <span>Key Clarifying Questions</span>
              </div>
              <div className="space-y-2.5">
                {activeAssessment.followUpQuestions.map((q) => (
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

          {/* Relevant Legal Concepts */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>Applicable Legal Principles & Concepts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeAssessment.relevantLegalConcepts.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-xs space-y-1"
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

          {/* Possible Practical Options */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Compass className="w-4 h-4 text-emerald-500" />
                <span>Possible Practical Paths Forward</span>
              </div>
              <span className="text-[11px] text-slate-700 dark:text-slate-300">
                Rule 10: Prioritize reversible steps
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeAssessment.possibleOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                        Option 0{idx + 1}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {opt.reversibility.toUpperCase()} REVERSIBILITY
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {opt.title}
                    </h4>

                    <div className="mt-3 space-y-1">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Advantages:
                      </span>
                      <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                        {opt.pros.map((pro, pIdx) => (
                          <li key={pIdx}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      Considerations:
                    </span>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                      {opt.risks.map((risk, rIdx) => (
                        <li key={rIdx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Checklist & Evidence to Collect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>Evidence to Secure Now</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {activeAssessment.evidenceToCollect.map((ev, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <HelpCircle className="w-4 h-4 text-blue-500" />
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
          </div>
        </div>
      )}
    </div>
  );
}
