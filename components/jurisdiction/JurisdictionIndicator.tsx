"use client";

import React, { useState } from "react";
import type { JurisdictionContext } from "@/types";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  X,
  Shield,
  FileCheck,
  Edit3,
} from "lucide-react";
import {
  applyUserJurisdictionOverride,
  formatJurisdictionBadge,
} from "@/lib/jurisdiction/jurisdictionDetector";

interface JurisdictionIndicatorProps {
  context?: JurisdictionContext;
  verifiedSourceCount?: number;
  uncertaintyCount?: number;
  onJurisdictionChange?: (updatedContext: JurisdictionContext) => void;
}

export function JurisdictionIndicator({
  context,
  verifiedSourceCount = 4,
  uncertaintyCount = 1,
  onJurisdictionChange,
}: JurisdictionIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(context?.country || "India");
  const [selectedState, setSelectedState] = useState(context?.stateOrUT || "Maharashtra");

  const currentCountry = context?.country || "India";
  const currentState = context?.stateOrUT || (currentCountry === "India" ? "Maharashtra" : undefined);
  const isIndia = currentCountry.toLowerCase() === "india";
  const isUS = currentCountry.toLowerCase() === "united states" || currentCountry.toLowerCase() === "us";

  const handleApplyOverride = () => {
    if (!context) return;
    const updated = applyUserJurisdictionOverride(context, {
      country: selectedCountry,
      stateOrUT: selectedState,
    });
    if (onJurisdictionChange) {
      onJurisdictionChange(updated);
    }
    setIsOverriding(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Compact Interactive Header Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs hover:border-blue-400 dark:hover:border-blue-500/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all text-left cursor-pointer"
        title="Click to view jurisdiction evidence & governing law details"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none" aria-hidden="true">
            {isIndia ? "🇮🇳" : isUS ? "🇺🇸" : "🌐"}
          </span>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {formatJurisdictionBadge(context)}
          </span>
        </div>

        <span className="text-slate-300 dark:text-slate-700">|</span>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
            <CheckCircle2 className="w-3 h-3" />
            Verified: {verifiedSourceCount}
          </span>
          {uncertaintyCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
              <AlertTriangle className="w-3 h-3" />
              {uncertaintyCount} Fact-Dependent
            </span>
          )}
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-y-0.5" />
      </button>

      {/* Detail Flyout Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="jurisdiction-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="jurisdiction-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                    Jurisdiction & Legal Forum
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Governing law determining applicable statutes & precedents
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsOverriding(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Jurisdiction Status Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Detected Jurisdiction
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                    <span aria-hidden="true">{isIndia ? "🇮🇳" : isUS ? "🇺🇸" : "🌐"}</span>
                    {formatJurisdictionBadge(context)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Confidence Rating
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                      context?.confidence === "high"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : context?.confidence === "medium"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    {context?.confidence || "High"} Confidence
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Source
                  </span>
                  <span className="capitalize font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {context?.source || "document"} evidence
                  </span>
                </div>

                {context?.governingLaw && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">
                      Governing Law Clause Excerpt:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-mono italic bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/60 dark:border-slate-800">
                      &ldquo;{context.governingLaw}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Supporting Evidence Snippets */}
              {context?.evidence && context.evidence.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-blue-500" />
                    Supporting Document Signals:
                  </span>
                  <ul className="space-y-1 pl-1">
                    {context.evidence.map((ev, i) => (
                      <li key={i} className="text-slate-600 dark:text-slate-400 text-[11px] flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ambiguity Warnings if any */}
              {context?.ambiguityWarnings && context.ambiguityWarnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Jurisdiction Ambiguity Warning</span>
                  </div>
                  {context.ambiguityWarnings.map((warn, i) => (
                    <p key={i} className="text-[11px] text-amber-700 dark:text-amber-400/90 pl-5">
                      {warn}
                    </p>
                  ))}
                </div>
              )}

              {/* Interactive Override Section */}
              {isOverriding ? (
                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3 pt-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Manual Jurisdiction Override
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                        Country
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200"
                      >
                        <option value="India">India</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Other">Other / International</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                        State / Union Territory
                      </label>
                      <input
                        type="text"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        placeholder="e.g. Maharashtra, Delaware"
                        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsOverriding(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyOverride}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs"
                    >
                      Apply Override
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    Need to test a different legal forum?
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOverriding(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Change Jurisdiction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
