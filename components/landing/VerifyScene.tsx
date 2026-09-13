"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, BookOpen, FileCode, CheckCircle2, ArrowRight } from "lucide-react";
import { useSceneScroll, subProgress } from "@/lib/hooks/useSceneScroll";

export function VerifyScene() {
  const [containerRef, progress, reducedMotion] = useSceneScroll();

  // Horizontal connection choreography
  const node1Progress = reducedMotion ? 1 : subProgress(progress, 0.05, 0.3);
  const line1Progress = reducedMotion ? 1 : subProgress(progress, 0.25, 0.5);
  const node2Progress = reducedMotion ? 1 : subProgress(progress, 0.35, 0.6);
  const line2Progress = reducedMotion ? 1 : subProgress(progress, 0.55, 0.75);
  const node3Progress = reducedMotion ? 1 : subProgress(progress, 0.65, 0.9);
  const stampProgress = reducedMotion ? 1 : subProgress(progress, 0.8, 1.0);

  // Horizontal slide offsets
  const node1Slide = reducedMotion ? 0 : (1 - node1Progress) * -40; // px
  const node2Slide = reducedMotion ? 0 : (1 - node2Progress) * 40;
  const node3Slide = reducedMotion ? 0 : (1 - node3Progress) * 60;

  return (
    <div
      ref={containerRef}
      className={`relative ${reducedMotion ? "h-auto py-20" : "h-[240vh]"}`}
    >
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Section Header */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200 dark:border-violet-800/80 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
            <span>02 · VERIFY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
            LawPilot shows where <br className="hidden sm:inline" />
            <span className="text-violet-600 dark:text-violet-400">the answer came from.</span>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
            No black-box answers. Findings connect through a transparent chain of verbatim contract quotes to official statutory authorities.
          </p>
        </div>

        {/* The Evidence Chain Physical Horizontal Assembly */}
        <div className="relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative items-stretch">
            {/* ── Node 1: Finding ── */}
            <div
              className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-6 shadow-xl relative transition-all duration-300 flex flex-col justify-between"
              style={{
                transform: `translateX(${node1Slide}px) scale(${0.95 + node1Progress * 0.05})`,
                opacity: node1Progress,
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                    FINDING · CRITICAL
                  </span>
                  <span className="text-xs text-slate-400 font-mono">01</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  Unamortized Liquidated Damages Penalty
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The flat ₹4,50,000 exit penalty operates as a coercive restraint of trade rather than genuine compensation for demonstrable training expenditure.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Confidence: 94%</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">High Exposure</span>
              </div>
            </div>

            {/* ── Node 2: Document Evidence ── */}
            <div
              className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 p-6 shadow-xl relative transition-all duration-300 flex flex-col justify-between"
              style={{
                transform: `translateX(${node2Slide}px) scale(${0.95 + node2Progress * 0.05})`,
                opacity: node2Progress,
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                    VERBATIM CONTRACT TEXT
                  </span>
                  <span className="text-xs text-slate-400 font-mono">02</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  <span>Clause 8.1 Extraction</span>
                </h3>
                <blockquote className="text-xs font-sans italic text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border-l-2 border-indigo-500 leading-relaxed">
                  &ldquo;...covenants to pay Employer a fixed sum of INR 4,50,000 as liquidated damages... irrecoverable on amortized basis.&rdquo;
                </blockquote>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Verified against uploaded raw document bytes
              </div>
            </div>

            {/* ── Node 3: Legal Source ── */}
            <div
              className="rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-white dark:bg-slate-900 p-6 shadow-xl relative transition-all duration-300 flex flex-col justify-between"
              style={{
                transform: `translateX(${node3Slide}px) scale(${0.95 + node3Progress * 0.05})`,
                opacity: node3Progress,
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900">
                    STATUTORY AUTHORITY
                  </span>
                  <span className="text-xs text-slate-400 font-mono">03</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  <span>Indian Contract Act, 1872 · Sec 27 & 74</span>
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Supreme Court of India · Niranjan Shankar Golikari
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Stipulations for liquidated damages must be genuine pre-estimates of actual damages. Pure penalty covenants without proof of loss are void.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Official Gazette Source
                </span>
                <Link
                  href="/analysis/demo-employment-agreement"
                  className="text-violet-600 dark:text-violet-400 font-semibold hover:underline flex items-center gap-0.5"
                >
                  <span>Explore chain</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Dynamic Desktop Connecting Lines (Animated draw progress) */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-1/2 left-[31%] w-[6%] h-0.5 -translate-y-1/2 bg-indigo-500 transition-all duration-200 origin-left"
            style={{
              transform: `scaleX(${line1Progress})`,
              boxShadow: "0 0 8px rgba(99, 102, 241, 0.6)",
            }}
          />
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-1/2 left-[64%] w-[6%] h-0.5 -translate-y-1/2 bg-violet-500 transition-all duration-200 origin-left"
            style={{
              transform: `scaleX(${line2Progress})`,
              boxShadow: "0 0 8px rgba(139, 92, 246, 0.6)",
            }}
          />
        </div>

        {/* Resolved Chain Stamp Footer */}
        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3 transition-opacity duration-300"
          style={{ opacity: stampProgress }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-white/10 dark:text-white border border-slate-800 dark:border-white/15 text-xs font-semibold shadow-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Fully Grounded Evidence Chain · Zero Hallucinated Citations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
