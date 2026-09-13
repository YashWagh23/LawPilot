"use client";

import React, { useState } from "react";
import {
  GitCompare,
  Upload,
  ShieldAlert,
  CheckCircle,
  FileText,
} from "lucide-react";

export default function ComparePage() {
  const [hasLoadedSample, setHasLoadedSample] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Intake Pathway 03
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300">·</span>
          <span className="text-xs text-slate-700 dark:text-slate-300">Redline & Version Analysis</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Compare Agreement Drafts & Redlines
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Upload two versions of an agreement to identify modified obligations, stealth deletions, and newly introduced liability risks.
        </p>
      </div>

      {/* Dual Document Upload Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Version A: Original / Base */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Version A · Original Baseline
            </span>
            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              Base Draft
            </span>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
            {hasLoadedSample ? (
              <div className="space-y-1">
                <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Commercial_Lease_Initial_Draft.pdf
                </p>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  Uploaded · 28 Pages · 42 Clauses
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-6 h-6 text-slate-700 dark:text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Drop original base contract here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Version B: Counterparty Markup */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Version B · Counterparty Proposed Redline
            </span>
            <span className="text-[11px] font-mono text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
              Proposed Changes
            </span>
          </div>

          <div className="border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-lg p-6 text-center">
            {hasLoadedSample ? (
              <div className="space-y-1">
                <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Commercial_Lease_Landlord_Markup_v2.pdf
                </p>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  Uploaded · 28 Pages · 4 Altered Clauses
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-6 h-6 text-blue-500 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Drop revised redline or counterparty draft
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sample Comparison Loader */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <GitCompare className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Need a demo comparison? Load sample lease revisions (Tenant Baseline vs. Landlord Markup).</span>
        </div>
        <button
          type="button"
          onClick={() => setHasLoadedSample(!hasLoadedSample)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <span>{hasLoadedSample ? "Clear Sample Files" : "Load Sample Redline Comparison"}</span>
        </button>
      </div>

      {/* Diff Inspection Area */}
      {hasLoadedSample && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Detected Risk Shifts in Version B
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400">
              2 One-Sided Additions Detected
            </span>
          </div>

          <div className="space-y-4">
            {/* Clause Diff Card 1 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Section 6.4: Accelerated Rent Remedy
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400">
                  Risk Escalated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-700 dark:text-slate-300 font-sans block mb-1">
                    Baseline (Version A)
                  </span>
                  &ldquo;...Tenant pays standard statutory damages under California law.&rdquo;
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-slate-900 dark:text-slate-100">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-sans block mb-1 font-bold">
                    Counterparty Added (Version B)
                  </span>
                  &ldquo;...Tenant pays <span className="bg-amber-200 dark:bg-amber-900 px-1 py-0.5 rounded">total remaining rent immediately without discount to present value</span> and Landlord has no duty to mitigate.&rdquo;
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                <strong>Impact:</strong> Landlord added an un-discounted rent acceleration penalty.
              </p>
            </div>

            {/* Clause Diff Card 2 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Section 19.3: Mutual Waiver of Perils
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Unchanged
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Standard subrogation waiver remained intact without modification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
