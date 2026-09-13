"use client";

import React from "react";
import Link from "next/link";
import { CheckSquare, ArrowRight, ShieldAlert, CheckCircle2, Briefcase } from "lucide-react";
import { useSceneScroll, subProgress } from "@/lib/hooks/useSceneScroll";

export function ActScene() {
  const [containerRef, progress, reducedMotion] = useSceneScroll();

  // Choreography keyframes
  const problemProgress = reducedMotion ? 1 : subProgress(progress, 0.05, 0.35);
  const check1Progress = reducedMotion ? 1 : subProgress(progress, 0.25, 0.55);
  const check2Progress = reducedMotion ? 1 : subProgress(progress, 0.45, 0.75);
  const check3Progress = reducedMotion ? 1 : subProgress(progress, 0.60, 0.85);
  const briefProgress = reducedMotion ? 1 : subProgress(progress, 0.70, 0.95);

  const check1Slide = reducedMotion ? 0 : (1 - check1Progress) * 50;
  const check2Slide = reducedMotion ? 0 : (1 - check2Progress) * 50;
  const check3Slide = reducedMotion ? 0 : (1 - check3Progress) * 50;
  const briefSlide = reducedMotion ? 0 : (1 - briefProgress) * 60;

  return (
    <div
      ref={containerRef}
      className={`relative ${reducedMotion ? "h-auto py-20" : "h-[200vh]"}`}
    >
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Section Header */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>03 · ACT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
            Turn uncertainty <br className="hidden sm:inline" />
            <span className="text-emerald-600 dark:text-emerald-400">into next steps.</span>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
            LawPilot converts complex legal findings into a pragmatic negotiation checklist and a Lawyer-Ready Brief.
          </p>
        </div>

        {/* Visual Stage (Problem into Action Checklist Transformation) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left / Center: Action Checklist */}
          <div className="lg:col-span-7 space-y-3">
            {/* Top: The Initial Legal Problem Header */}
            <div
              className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 p-4 flex items-center justify-between gap-3 shadow-xs transition-all duration-300"
              style={{
                opacity: 0.5 + problemProgress * 0.5,
              }}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 block">
                    Legal Issue
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Unamortized ₹4.5 Lakhs Exit Penalty
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                Action Plan
              </span>
            </div>

            {/* Checklist Item 1 */}
            <div
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-start gap-3 transition-all duration-300"
              style={{
                transform: `translateX(${check1Slide}px)`,
                opacity: check1Progress,
              }}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    1. Request itemized training receipts
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    Immediate
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ask HR for formal invoice records verifying actual external course expenditure prior to signing.
                </p>
              </div>
            </div>

            {/* Checklist Item 2 */}
            <div
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-start gap-3 transition-all duration-300"
              style={{
                transform: `translateX(${check2Slide}px)`,
                opacity: check2Progress,
              }}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    2. Propose pro-rata amortization schedule
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                    Negotiate
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Reduce the reimbursement obligation by 1/24th for each completed month of active employment.
                </p>
              </div>
            </div>

            {/* Checklist Item 3 */}
            <div
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-start gap-3 transition-all duration-300"
              style={{
                transform: `translateX(${check3Slide}px)`,
                opacity: check3Progress,
              }}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    3. Counter-Draft: Clause 8.1 Amendment
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                    Draft
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans italic bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1.5">
                  &ldquo;Reimbursement strictly capped to verifiable third-party certification costs amortized over 12 months.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Right: Lawyer-Ready Brief Card */}
          <div
            className="lg:col-span-5 transition-all duration-300"
            style={{
              transform: `translateX(${briefSlide}px)`,
              opacity: briefProgress,
            }}
          >
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Lawyer-Ready Brief Output
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                Get maximum value from legal counsel
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Structured attorney brief with facts, extracted clauses, and specific questions ready for consultation.
              </p>

              <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs mb-5">
                <div className="font-semibold text-slate-900 dark:text-slate-200">
                  Targeted question for your lawyer:
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic">
                  &ldquo;Given Maharashtra High Court rulings on Section 27, can the employer enforce this training bond without proving actual loss?&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Saves 45 mins of consultation
                </span>
                <Link
                  href="/analysis/demo-employment-agreement"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 group"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Inspect Action Plan</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
