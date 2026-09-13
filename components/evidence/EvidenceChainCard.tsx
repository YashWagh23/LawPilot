"use client";

import React, { useState } from "react";
import type { EvidenceChain } from "@/types";
import { SeverityBadge } from "./SeverityBadge";
import {
  FileText,
  BookOpen,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { formatJurisdictionBadge } from "@/lib/jurisdiction/jurisdictionDetector";

interface EvidenceChainCardProps {
  chain: EvidenceChain;
  defaultExpanded?: boolean;
}

export function EvidenceChainCard({
  chain,
  defaultExpanded = true,
}: EvidenceChainCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900/70 overflow-hidden">
      {/* Header / Finding Summary */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <SeverityBadge severity={chain.finding.severity} />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {chain.finding.category}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
          >
            <span>{isExpanded ? "Collapse Evidence Chain" : "Inspect Evidence Chain"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <h3 className="mt-2.5 text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
          {chain.finding.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {chain.finding.summary}
        </p>

        {/* Jurisdiction & Legal Context Banner */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
              JURISDICTION
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {chain.jurisdictionContext
                ? formatJurisdictionBadge(chain.jurisdictionContext)
                : chain.legalClaims[0]?.jurisdiction || "India · Maharashtra"}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
              LEGAL CONTEXT
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
              {chain.verification?.status === "verified" ? "Verified" : "Contextual"}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Interactive Chain Progression */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Visual Step Indicator Label */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Transparent Reasoning & Grounded Evidence
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Verified Chain
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {/* Step 1: Document Evidence */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs font-medium">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    1. Document Evidence
                  </span>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {chain.documentEvidence.section}
                    {chain.documentEvidence.pageNumber &&
                      ` · Page ${chain.documentEvidence.pageNumber}`}
                  </span>
                </div>
                <div className="mt-2 p-3.5 rounded-lg bg-amber-500/5 border-l-2 border-amber-500/60 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed dark:bg-amber-950/20">
                  &ldquo;{chain.documentEvidence.exactQuote}&rdquo;
                </div>
              </div>
            </div>

            {/* Step 2: Legal Source / Authoritative Context */}
            {(() => {
              const legalSource = chain.legalSource || (chain.legalSources && chain.legalSources[0]);
              if (!legalSource) return null;
              return (
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-xs font-medium">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                        2. Authoritative Legal Context
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                        {legalSource.citation}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        {legalSource.jurisdiction || "India"}
                      </span>
                    </div>

                    <div className="mt-2 p-3.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {legalSource.title}
                      </p>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic">
                        &ldquo;{legalSource.excerpt || legalSource.relevantExcerpt}&rdquo;
                      </p>
                      {legalSource.notes && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          <strong className="text-slate-700 dark:text-slate-300">Analysis Note: </strong>
                          {legalSource.notes}
                        </p>
                      )}
                      {(legalSource.sourceUrl || legalSource.url) && (
                        <div className="mt-2">
                          <a
                            href={legalSource.sourceUrl || legalSource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Official Authority Reference
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Step 3: Certainty / Verification Assessment */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    3. Certainty Assessment
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      (chain.verification?.confidenceLevel || chain.confidence?.level) === "high"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : (chain.verification?.confidenceLevel || chain.confidence?.level) === "moderate"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {((chain.verification?.confidenceLevel || chain.confidence?.level || "moderate") as string).toUpperCase()} CONFIDENCE
                  </span>
                  {chain.verification?.status && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      {chain.verification.status.replace("_", " ")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {chain.confidence?.rationale ||
                    (chain.verification?.issues.length
                      ? chain.verification.issues.join("; ")
                      : "Verified against authoritative legal sources in matching jurisdiction.")}
                </p>
              </div>
            </div>

            {/* Step 4: What is Still Unknown (Rule 5: Transparent Uncertainty) */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-xs font-medium">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    4. What is Still Unknown / Factual Dependencies
                  </span>
                </div>
                <div className="mt-1.5 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 space-y-2">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {chain.uncertainty?.explanation ||
                      (chain.uncertainties && chain.uncertainties.length > 0
                        ? chain.uncertainties[0]
                        : "Application is fact-dependent and requires professional legal counsel.")}
                  </p>
                  {((chain.uncertainty?.factualDependencies && chain.uncertainty.factualDependencies.length > 0) ||
                    (chain.uncertainties && chain.uncertainties.length > 1)) && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Pending Facts:
                      </span>
                      <ul className="mt-1 list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                        {(chain.uncertainty?.factualDependencies || chain.uncertainties.slice(1)).map((fact, idx) => (
                          <li key={idx}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 5: Practical Next Step (Rule 10: Reversible Actions) */}
            {(() => {
              const nextStep = chain.practicalNextStep || (chain.nextSteps && chain.nextSteps[0]);
              if (!nextStep) return null;
              return (
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-medium">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        5. Practical Next Step
                      </span>
                      {nextStep.isReversible && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-medium">
                          Reversible Action
                        </span>
                      )}
                    </div>
                    <div className="mt-2 p-3.5 rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold">
                          {nextStep.title}
                        </h4>
                        <span className="text-[11px] text-slate-300">
                          {nextStep.recommendedTimeline}
                        </span>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {nextStep.description}
                      </p>
                      {nextStep.practicalAdvice && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 dark:border-slate-700 flex items-start gap-1.5 text-xs text-slate-300">
                          <strong className="text-white">Counsel Negotiation Tip:</strong>{" "}
                          {nextStep.practicalAdvice}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
