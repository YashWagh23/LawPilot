"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCtaScene() {
  return (
    <section className="relative border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0C0E14] lp-scene-01">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* Editorial layout: left-aligned, no center-everything default */}
        <div className="max-w-2xl">
          {/* Step label */}
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-5 tracking-wider">
            05 / Instant Analysis &mdash; AI for Legal Documents
          </p>

          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] lp-text-balance">
            Read it once.
            <br />
            Understand it completely.
          </h2>

          <p className="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed lp-text-pretty max-w-xl">
            Upload your agreement and LawPilot returns a structured analysis: key issues, statutory context,
            evidence chains, and a practical preparation plan — in under a minute.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
            <Link
              href="/review"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors duration-150"
            >
              Analyze a document
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/analysis/demo-employment-agreement"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
            >
              See a sample analysis
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">
            No account required. PDF, DOCX, or TXT. Max 15 MB.
          </p>
        </div>

        {/* Separator line */}
        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800/60">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-sm">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Document Review</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Clause-by-clause analysis with evidence chains and verified legal context.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Compare Documents</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Side-by-side redline analysis to surface what changed and why it matters.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Situation Navigator</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Describe your situation in plain English and get structured legal context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
