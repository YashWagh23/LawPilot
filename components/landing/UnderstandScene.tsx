"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { useSceneScroll, subProgress } from "@/lib/hooks/useSceneScroll";

export function UnderstandScene() {
  const [containerRef, progress, reducedMotion, isDesktop] = useSceneScroll();

  // Choreography keyframes (active on desktop)
  const isAnimated = isDesktop && !reducedMotion;
  const docShift = isAnimated ? subProgress(progress, 0.2, 0.6) * -18 : 0; // percent
  const highlightProgress = isAnimated ? subProgress(progress, 0.25, 0.55) : 1;
  const metricSlide = isAnimated ? (1 - subProgress(progress, 0.35, 0.65)) * 60 : 0; // px
  const metricOpacity = isAnimated ? subProgress(progress, 0.35, 0.6) : 1;
  const plainCardSlide = isAnimated ? (1 - subProgress(progress, 0.55, 0.85)) * 80 : 0; // px
  const plainCardOpacity = isAnimated ? subProgress(progress, 0.55, 0.8) : 1;

  return (
    <div
      ref={containerRef}
      className="relative h-auto py-14 sm:py-20 lg:h-[220vh] motion-reduce:lg:h-auto motion-reduce:lg:py-14"
    >
      <div className="w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden motion-reduce:lg:static motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible">
        {/* Section Header */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>01 · UNDERSTAND</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
            See what your contract <br className="hidden sm:inline" />
            <span className="text-indigo-600 dark:text-indigo-400">actually says.</span>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
            Dense legal text is automatically deconstructed, isolating the hidden terms and financial obligations that matter.
          </p>
        </div>

        {/* Visual Stage (Horizontal Slide Canvas) */}
        <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center min-h-[420px]">
          {/* Left / Center: Contract Document Canvas */}
          <div
            className="lg:col-span-7 transition-transform duration-100 ease-out max-lg:!transform-none"
            style={{
              transform: `translateX(${docShift}%)`,
            }}
          >
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
              {/* Document Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block leading-none">
                      Employment & Services Agreement
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      DocRef: EMP-2026-IN · Clause Extract
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Page 4 of 12
                </span>
              </div>

              {/* Clause 7.3 (Quiet context) */}
              <div
                className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4 transition-opacity duration-300 font-sans"
                style={{ opacity: 1 - highlightProgress * 0.7 }}
              >
                <strong className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 not-italic block mb-1">
                  7.3 Non-Disclosure & Intellectual Property
                </strong>
                The Employee shall hold in strict confidence all technical materials, business architecture, customer records, and trade secrets disclosed during tenure...
              </div>

              {/* Clause 8.1 (The High-Friction Highlight Target) */}
              <div
                className="relative rounded-xl p-4 transition-all duration-300"
                style={{
                  backgroundColor:
                    highlightProgress > 0.1
                      ? `rgba(245, 158, 11, ${0.04 + highlightProgress * 0.08})`
                      : "transparent",
                  borderWidth: "1px",
                  borderColor:
                    highlightProgress > 0.1
                      ? `rgba(245, 158, 11, ${highlightProgress * 0.7})`
                      : "transparent",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    8.1 Training Expense Reimbursement & Lock-in
                  </span>
                  {highlightProgress > 0.4 && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-opacity duration-300"
                      style={{ opacity: highlightProgress }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Critical Friction
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-[13px] font-sans leading-relaxed text-slate-800 dark:text-slate-200">
                  &ldquo;In the event the Employee terminates employment prior to completing twenty-four (24) months of continuous service, the Employee covenants to pay the Employer a fixed sum of{" "}
                  <mark
                    className="rounded px-1 transition-colors duration-300"
                    style={{
                      backgroundColor:
                        highlightProgress > 0.3
                          ? "rgba(245, 158, 11, 0.35)"
                          : "transparent",
                      color: "inherit",
                    }}
                  >
                    INR 4,50,000 (Rupees Four Lakhs Fifty Thousand)
                  </mark>{" "}
                  as pre-estimated liquidated damages for training and onboarding costs, irrecoverable on amortized basis.&rdquo;
                </p>
              </div>

              {/* Clause 9.1 (Quiet context) */}
              <div
                className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mt-4 transition-opacity duration-300 font-sans"
                style={{ opacity: 1 - highlightProgress * 0.7 }}
              >
                <strong className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 not-italic block mb-1">
                  9.1 Post-Termination Restraint
                </strong>
                The Employee shall not engage with competitive entities operating in the same territory for a period of twelve (12) months following separation...
              </div>
            </div>
          </div>

          {/* Right: Slide-In Extraction & Plain-English Interpretation */}
          <div className="lg:col-span-5 space-y-4">
            {/* Extracted Exposure Badge */}
            <div
              className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/40 p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all duration-300 max-lg:!opacity-100 max-lg:!transform-none"
              style={{
                transform: `translateX(${metricSlide}px)`,
                opacity: metricOpacity,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Extracted Financial Exposure
                </span>
                <span className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                  Clause 8.1
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                ₹4,50,000
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Fixed non-amortized liquidated damages required upon early exit.
              </p>
            </div>

            {/* Plain-English Breakdown Card */}
            <div
              className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xl transition-all duration-300 relative overflow-hidden max-lg:!opacity-100 max-lg:!transform-none"
              style={{
                transform: `translateX(${plainCardSlide}px)`,
                opacity: plainCardOpacity,
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Plain-English Interpretation
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                &ldquo;If you leave within 2 years, you owe ₹4.5 Lakhs regardless of real training costs.&rdquo;
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                The agreement treats onboarding as an unamortized debt penalty rather than legitimate reimbursable expenditure.
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Statutory check linked
                </span>
                <Link
                  href="/analysis/demo-employment-agreement"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 group"
                >
                  <span>View why</span>
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
