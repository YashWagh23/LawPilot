"use client";

import React from "react";
import Link from "next/link";
import { GitCompare, AlertCircle, FileCheck, ArrowUpRight } from "lucide-react";
import { useSceneScroll, subProgress } from "@/lib/hooks/useSceneScroll";

export function CompareScene() {
  const [containerRef, progress, reducedMotion, isDesktop] = useSceneScroll();

  const isAnimated = isDesktop && !reducedMotion;
  // Two documents sliding against each other (desktop only)
  const slideProgress = isAnimated ? subProgress(progress, 0.05, 0.45) : 1;
  const leftDocOffset = isAnimated ? (1 - slideProgress) * -40 : 0; // px
  const rightDocOffset = isAnimated ? (1 - slideProgress) * 40 : 0; // px

  // Redline highlighting progress
  const redlineProgress = isAnimated ? subProgress(progress, 0.35, 0.7) : 1;

  // Material shift chips slide in
  const chipsProgress = isAnimated ? subProgress(progress, 0.6, 0.95) : 1;
  const chipsSlide = isAnimated ? (1 - chipsProgress) * 30 : 0; // px

  return (
    <div
      ref={containerRef}
      className="relative h-auto py-14 sm:py-20 lg:h-[200vh] motion-reduce:lg:h-auto motion-reduce:lg:py-14 lp-scene-04"
    >
      <div className="w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden motion-reduce:lg:static motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible">
        {/* Section Header */}
        <div className="max-w-2xl mb-8 sm:mb-10">
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-4 tracking-wider">
            04 / Compare
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] lp-text-balance">
            Watch the contract change before your eyes.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed lp-text-pretty">
            Compare redlined versions to expose substantive risk shifts, fee escalations, and forum jurisdiction traps.
          </p>
        </div>

        {/* Visual Stage (Two documents sliding against each other) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative items-stretch mb-6">
          {/* Previous Version (Slides in from left) */}
          <div
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all duration-300 max-lg:!opacity-100 max-lg:!transform-none"
            style={{
              transform: `translateX(${leftDocOffset}px)`,
              opacity: 0.4 + slideProgress * 0.6,
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                PREVIOUS DRAFT (v1.0)
              </span>
              <span className="text-[10px] text-slate-400">Original Baseline</span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed font-sans text-slate-700 dark:text-slate-300">
              <p>
                <strong className="font-semibold text-slate-900 dark:text-white">Clause 4.1 Notice Period:</strong> Either party may terminate by providing{" "}
                <span className="line-through text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/60 px-1 py-0.5 rounded">
                  60 (sixty) days
                </span>{" "}
                prior written notice.
              </p>
              <p>
                <strong className="font-semibold text-slate-900 dark:text-white">Clause 8.1 Training Bond:</strong> Fixed pre-estimated reimbursement capped at{" "}
                <span className="line-through text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/60 px-1 py-0.5 rounded">
                  INR 2,00,000
                </span>{" "}
                with quarterly amortization.
              </p>
              <p>
                <strong className="font-semibold text-slate-900 dark:text-white">Clause 14.2 Jurisdiction:</strong> Courts of competent jurisdiction in{" "}
                <span className="line-through text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/60 px-1 py-0.5 rounded">
                  Pune, Maharashtra
                </span>{" "}
                shall have exclusive purview.
              </p>
            </div>
          </div>

          {/* Revised Version (Slides in from right) */}
          <div
            className="rounded-2xl border border-indigo-200 dark:border-indigo-900/80 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all duration-300 relative overflow-hidden max-lg:!opacity-100 max-lg:!transform-none"
            style={{
              transform: `translateX(${rightDocOffset}px)`,
              opacity: 0.4 + slideProgress * 0.6,
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-indigo-500" />
                REVISED DRAFT (v2.0)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                3 Material Shifts
              </span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed font-sans text-slate-800 dark:text-slate-200">
              <p>
                <strong className="font-semibold text-slate-900 dark:text-white">Clause 4.1 Notice Period:</strong> Either party may terminate by providing{" "}
                <span
                  className="font-semibold px-1 py-0.5 rounded transition-colors duration-300"
                  style={{
                    backgroundColor: redlineProgress > 0.2 ? "rgba(16, 185, 129, 0.2)" : "transparent",
                    color: redlineProgress > 0.2 ? "#059669" : "inherit",
                  }}
                >
                  90 (ninety) days
                </span>{" "}
                prior written notice.
              </p>
              <p>
                <strong className="font-semibold text-slate-900 dark:text-white">Clause 8.1 Training Bond:</strong> Fixed pre-estimated reimbursement increased to{" "}
                <span
                  className="font-semibold px-1 py-0.5 rounded transition-colors duration-300"
                  style={{
                    backgroundColor: redlineProgress > 0.4 ? "rgba(220, 38, 38, 0.15)" : "transparent",
                    color: redlineProgress > 0.4 ? "#dc2626" : "inherit",
                  }}
                >
                  INR 4,50,000 (Non-Amortized)
                </span>
                .
              </p>
              <p>
                <strong className="font-semibold text-slate-900 dark:text-white">Clause 14.2 Jurisdiction:</strong> Courts of competent jurisdiction across{" "}
                <span
                  className="font-semibold px-1 py-0.5 rounded transition-colors duration-300"
                  style={{
                    backgroundColor: redlineProgress > 0.6 ? "rgba(139, 92, 246, 0.2)" : "transparent",
                    color: redlineProgress > 0.6 ? "#7c3aed" : "inherit",
                  }}
                >
                  Courts in Mumbai and across All-India
                </span>{" "}
                shall have purview.
              </p>
            </div>
          </div>
        </div>

        {/* Material Shift Progressive Badges */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 transition-all duration-300 max-lg:!opacity-100 max-lg:!transform-none"
          style={{
            transform: `translateY(${chipsSlide}px)`,
            opacity: chipsProgress,
          }}
        >
          <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 px-4 py-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white">₹2L → ₹4.5L</span>
            </div>
            <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/60 px-1.5 py-0.5 rounded">
              +125% Liability
            </span>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 px-4 py-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white">60d → 90d Notice</span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
              +30d Lock-in
            </span>
          </div>

          <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/80 dark:bg-purple-950/40 px-4 py-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white">Maharashtra → All-India</span>
            </div>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">
              Forum Shift
            </span>
          </div>
        </div>

        {/* Compare CTA footer */}
        <div className="mt-5 text-center">
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 group"
          >
            <span>Launch Document Comparison Workspace</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
