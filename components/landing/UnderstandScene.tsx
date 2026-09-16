"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { useSceneScroll, subProgress } from "@/lib/hooks/useSceneScroll";

export function UnderstandScene() {
  const [containerRef, progress, reducedMotion, isDesktop] = useSceneScroll();

  // Choreography keyframes (active on desktop with motion)
  const isAnimated = isDesktop && !reducedMotion;

  // 4 Scroll Stages:
  // 1. Full Document (0.00 – 0.25)
  // 2. Focus Clause (0.25 – 0.50)
  // 3. Extract Term  (0.50 – 0.75)
  // 4. Plain English (0.75 – 1.00)
  const stage = !isAnimated
    ? 4
    : progress < 0.25
    ? 1
    : progress < 0.50
    ? 2
    : progress < 0.75
    ? 3
    : 4;

  const focusProgress = isAnimated ? subProgress(progress, 0.20, 0.45) : 1;
  const extractProgress = isAnimated ? subProgress(progress, 0.45, 0.70) : 1;
  const explainProgress = isAnimated ? subProgress(progress, 0.70, 0.95) : 1;

  // Subtle left shift for document on desktop (only -4%, calm and bounded)
  const docShift = isAnimated ? subProgress(progress, 0.45, 0.70) * -4 : 0;

  // Surrounding context clauses dim down gently during focus
  const contextOpacity = 1 - focusProgress * 0.65;

  // Right-hand transformation container motion
  const rightSlide = isAnimated ? (1 - extractProgress) * 24 : 0; // px
  const rightOpacity = isAnimated ? extractProgress : 1;

  // Cross-fade interpolation between Stage 3 (Extract) and Stage 4 (Explain)
  const morphProgress = isAnimated ? subProgress(explainProgress, 0.1, 0.6) : 1;

  return (
    <div
      id="scene-understand"
      ref={containerRef}
      className="relative h-auto py-14 sm:py-20 lg:h-[220vh] motion-reduce:lg:h-auto motion-reduce:lg:py-14"
    >
      <div className="w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden motion-reduce:lg:static motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible">
        {/* Section Header */}
        <div className="max-w-2xl mb-6 sm:mb-8">
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-4 tracking-wider">
            01 / Understand
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] lp-text-balance">
            See what your contract actually says.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed lp-text-pretty">
            Complex clauses become clear.
          </p>
        </div>

        {/* 4-Stage Transformation Pipeline Bar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-6 text-xs font-medium" aria-label="Transformation stages">
          {[
            { step: 1, label: "Document", active: true },
            { step: 2, label: "Focus Clause", active: stage >= 2 },
            { step: 3, label: "Extract Term", active: stage >= 3 },
            { step: 4, label: "Plain English", active: stage >= 4 },
          ].map((s, idx) => (
            <React.Fragment key={s.label}>
              <div
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                  stage === s.step
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : s.active
                    ? "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    stage === s.step
                      ? "bg-white text-indigo-600"
                      : s.active
                      ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {s.step}
                </span>
                <span>{s.label}</span>
              </div>
              {idx < 3 && (
                <span
                  className={`text-xs transition-colors duration-300 ${
                    stage > idx + 1
                      ? "text-indigo-500 dark:text-indigo-400 font-bold"
                      : "text-slate-300 dark:text-slate-700"
                  }`}
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Visual Stage (Anchored Document Canvas + Seamless Single Transformation) */}
        <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center min-h-[420px]">
          {/* Left: Grounded Contract Document Anchor */}
          <div
            className="lg:col-span-7 transition-transform duration-200 ease-out max-lg:!transform-none relative"
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

              {/* Clause 7.3 (Quiet context - dims softly during focus) */}
              <div
                className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4 transition-opacity duration-300 font-sans"
                style={{ opacity: contextOpacity }}
              >
                <strong className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 not-italic block mb-1">
                  7.3 Non-Disclosure & Intellectual Property
                </strong>
                The Employee shall hold in strict confidence all technical materials, business architecture, customer records, and trade secrets disclosed during tenure...
              </div>

              {/* Clause 8.1 (The High-Friction Highlight Target) */}
              <div
                className="relative rounded-xl p-4 sm:p-4.5 transition-all duration-300"
                style={{
                  backgroundColor:
                    focusProgress > 0.05
                      ? `rgba(245, 158, 11, ${0.03 + focusProgress * 0.07})`
                      : "transparent",
                  borderWidth: "1px",
                  borderColor:
                    focusProgress > 0.05
                      ? `rgba(245, 158, 11, ${focusProgress * 0.5})`
                      : "transparent",
                  boxShadow:
                    focusProgress > 0.2
                      ? `0 0 20px -5px rgba(245, 158, 11, ${focusProgress * 0.15})`
                      : "none",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    8.1 Training Expense Reimbursement & Lock-in
                  </span>
                  {focusProgress > 0.4 && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-opacity duration-300"
                      style={{ opacity: focusProgress }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Critical Friction
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-[13px] font-sans leading-relaxed text-slate-800 dark:text-slate-200">
                  &ldquo;In the event the Employee terminates employment prior to completing twenty-four (24) months of continuous service, the Employee covenants to pay the Employer a fixed sum of{" "}
                  <mark
                    className="rounded px-1.5 py-0.5 transition-all duration-300 font-semibold"
                    style={{
                      backgroundColor:
                        focusProgress > 0.15
                          ? "rgba(245, 158, 11, 0.35)"
                          : "transparent",
                      color: "inherit",
                    }}
                  >
                    INR 4,50,000 (Rupees Four Lakhs Fifty Thousand)
                  </mark>{" "}
                  as pre-estimated liquidated damages for training and onboarding costs, irrecoverable on amortized basis.&rdquo;
                </p>

                {/* Desktop Extraction Beam / Tag */}
                {isAnimated && extractProgress > 0.1 && (
                  <div
                    className="hidden lg:flex items-center absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full z-20 pointer-events-none transition-opacity duration-200"
                    style={{ opacity: extractProgress }}
                    aria-hidden="true"
                  >
                    <div className="w-6 h-[2px] bg-gradient-to-r from-amber-500 to-indigo-500" />
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-sm -ml-0.5">
                      EXTRACT
                    </span>
                  </div>
                )}
              </div>

              {/* Clause 9.1 (Quiet context - dims softly during focus) */}
              <div
                className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mt-4 transition-opacity duration-300 font-sans"
                style={{ opacity: contextOpacity }}
              >
                <strong className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 not-italic block mb-1">
                  9.1 Post-Termination Restraint
                </strong>
                The Employee shall not engage with competitive entities operating in the same territory for a period of twelve (12) months following separation...
              </div>
            </div>
          </div>

          {/* Right: The Single Transformation Container (Stage 3 Extract → Stage 4 Plain English) */}
          <div
            className="lg:col-span-5 transition-all duration-200 ease-out max-lg:!transform-none max-lg:!opacity-100"
            style={{
              transform: `translateX(${rightSlide}px)`,
              opacity: rightOpacity,
            }}
          >
            {/* Desktop Stage 3: Extracted Value View (Morphs into Stage 4) */}
            {isAnimated && morphProgress < 0.95 && (
              <div
                className="rounded-2xl border border-amber-300/90 dark:border-amber-700/60 bg-amber-50/95 dark:bg-amber-950/50 p-6 sm:p-7 shadow-xl backdrop-blur-md transition-all duration-200"
                style={{
                  opacity: 1 - morphProgress,
                  transform: `scale(${1 - morphProgress * 0.04})`,
                  display: morphProgress >= 0.95 ? "none" : "block",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Extracted Liability · Clause 8.1
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                    Exit Obligation
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight my-2">
                  ₹4,50,000
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Fixed non-amortized liquidated damages demanded upon early departure.
                </p>
                <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                  <span>Clause extraction verified</span>
                  <span>Transforming to plain English ↓</span>
                </div>
              </div>
            )}

            {/* Stage 4: Plain-English Interpretation (Final Dominant Focus on Desktop & Mobile) */}
            {(!isAnimated || morphProgress > 0.05) && (
              <div
                className="rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-200"
                style={{
                  opacity: isAnimated ? morphProgress : 1,
                  transform: `scale(${isAnimated ? 0.96 + morphProgress * 0.04 : 1})`,
                  display: isAnimated && morphProgress <= 0.05 ? "none" : "block",
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Plain-English Interpretation
                  </span>
                  <span className="ml-auto text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                    ₹4.5L · Clause 8.1
                  </span>
                </div>

                <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  &ldquo;If you leave within 2 years, the agreement requires ₹4.5 Lakhs.&rdquo;
                </h4>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                  The agreement treats onboarding as an unamortized debt penalty rather than legitimate reimbursable expenditure.
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Statutory check linked
                  </span>
                  <Link
                    href="/analysis/demo-employment-agreement"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 group"
                  >
                    <span>View why</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
