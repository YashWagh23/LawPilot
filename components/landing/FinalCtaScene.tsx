"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, FileText, GitCompare, ShieldCheck, CheckCircle2, Lock, ArrowRight } from "lucide-react";

export function FinalCtaScene() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden border-t border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white to-slate-50 dark:from-[#0C0E14] dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 mb-6">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <span>Competition-Ready Legal AI</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
          Understand your agreements <br />
          <span className="text-indigo-600 dark:text-indigo-400">before you sign.</span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          Experience instant contract analysis, grounded evidence citations, and structured lawyer-ready briefings without a login wall.
        </p>

        {/* Pathways Grid */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-2xl mx-auto">
          <Link
            href="/analysis/demo-employment-agreement"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Try Flagship Demo</span>
            <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-indigo-700/80 text-indigo-100">
              🇮🇳 India
            </span>
          </Link>

          <Link
            href="/review"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Document Review</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            href="/compare"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <GitCompare className="w-4 h-4 text-slate-500" />
            <span>Compare Redlines</span>
          </Link>
        </div>

        {/* Security & trust reassurance */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Zero Registration Required
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            Untrusted Memory Isolation Boundary
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            100% Free Competition Evaluation
          </span>
        </div>
      </div>
    </section>
  );
}
