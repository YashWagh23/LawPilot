"use client";

import React, { useState } from "react";
import type { EvidenceChain } from "@/types";
import { SeverityBadge } from "./SeverityBadge";
import {
  FileText,
  BookOpen,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { formatJurisdictionBadge } from "@/lib/jurisdiction/jurisdictionDetector";
import { getChainVerificationBadge, VERIFICATION_TONE_CLASSES } from "@/lib/analysis/verificationState";

interface EvidenceChainCardProps {
  chain: EvidenceChain;
  defaultExpanded?: boolean;
}

export function EvidenceChainCard({
  chain,
  defaultExpanded = true,
}: EvidenceChainCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const verificationBadge = getChainVerificationBadge(chain);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      {/* Header / Finding Summary */}
      <div className="px-4 py-3.5 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={chain.finding.severity} />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {chain.finding.category}
            </span>
            <span aria-hidden="true" className="text-slate-200 dark:text-slate-700">·</span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {chain.jurisdictionContext
                ? formatJurisdictionBadge(chain.jurisdictionContext)
                : chain.legalClaims[0]?.jurisdiction || "Jurisdiction not established"}
            </span>
            {chain.verification?.status && (
              <>
                <span aria-hidden="true" className="text-slate-200 dark:text-slate-700">·</span>
                <span
                  className={`text-[11px] font-medium ${VERIFICATION_TONE_CLASSES[verificationBadge.tone].text}`}
                  title={verificationBadge.detail}
                >
                  {verificationBadge.label}
                </span>
              </>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {chain.finding.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed lp-text-pretty">
            {chain.finding.summary}
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors shrink-0 mt-0.5 cursor-pointer"
        >
          <span>{isExpanded ? "Collapse" : "Inspect chain"}</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Expanded: Linear Evidence Trace */}
      {isExpanded && (
        <div className="px-4 py-5 space-y-0">
          {/* Header label */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Evidence trace
            </span>
          </div>

          {/* The 5-step trace — uses lp-trace class for connecting line */}
          <div className="lp-trace space-y-6">
            {/* Step 1: Document Evidence */}
            <div className="relative">
              {/* Step number indicator */}
              <div className="absolute -left-8 top-0 flex items-center justify-center w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                <FileText className="w-2.5 h-2.5" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Document evidence
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {chain.documentEvidence.section}
                    {chain.documentEvidence.pageNumber &&
                      ` · p.${chain.documentEvidence.pageNumber}`}
                  </span>
                </div>
                <blockquote className="lp-quote">
                  &ldquo;{chain.documentEvidence.exactQuote}&rdquo;
                </blockquote>
              </div>
            </div>

            {/* Step 2: Legal Authority */}
            {(() => {
              const legalSource = chain.legalSource || (chain.legalSources && chain.legalSources[0]);
              if (!legalSource) return null;
              return (
                <div className="relative">
                  <div className="absolute -left-8 top-0 flex items-center justify-center w-5 h-5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    <BookOpen className="w-2.5 h-2.5" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                        Authoritative legal context
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {legalSource.citation}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {legalSource.jurisdiction || "Jurisdiction not stated"}
                      </span>
                    </div>

                    <div className="p-3 rounded border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {legalSource.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
                        &ldquo;{legalSource.excerpt || legalSource.relevantExcerpt}&rdquo;
                      </p>
                      {legalSource.notes && (
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                          <strong className="font-medium text-slate-600 dark:text-slate-400">Note: </strong>
                          {legalSource.notes}
                        </p>
                      )}
                      {(legalSource.sourceUrl || legalSource.url) && (
                        <a
                          href={legalSource.sourceUrl || legalSource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Official reference
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Step 3: Certainty Assessment */}
            <div className="relative">
              <div className="absolute -left-8 top-0 flex items-center justify-center w-5 h-5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Certainty assessment
                  </span>
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                      (chain.verification?.confidenceLevel || chain.confidence?.level) === "high"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : (chain.verification?.confidenceLevel || chain.confidence?.level) === "moderate"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {((chain.verification?.confidenceLevel || chain.confidence?.level || "moderate") as string).toLowerCase()} confidence
                  </span>
                  {chain.verification?.status && (
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {chain.verification.status.replace("_", " ")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {chain.confidence?.rationale ||
                    (chain.verification?.issues.length
                      ? chain.verification.issues.join("; ")
                      : verificationBadge.tone === "verified"
                      ? "Verified against authoritative legal sources in matching jurisdiction."
                      : verificationBadge.detail)}
                </p>
              </div>
            </div>

            {/* Step 4: What is Unknown */}
            <div className="relative">
              <div className="absolute -left-8 top-0 flex items-center justify-center w-5 h-5 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                <HelpCircle className="w-2.5 h-2.5" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                  What is still unknown
                </span>
                <div className="p-3 rounded border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {chain.uncertainty?.explanation ||
                      (chain.uncertainties && chain.uncertainties.length > 0
                        ? chain.uncertainties[0]
                        : "Application is fact-dependent and requires professional legal counsel.")}
                  </p>
                  {((chain.uncertainty?.factualDependencies && chain.uncertainty.factualDependencies.length > 0) ||
                    (chain.uncertainties && chain.uncertainties.length > 1)) && (
                    <div className="mt-2 pt-2 border-t border-amber-200/40 dark:border-amber-800/30">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Pending facts:</p>
                      <ul className="space-y-0.5">
                        {(chain.uncertainty?.factualDependencies || chain.uncertainties.slice(1)).map((fact, idx) => (
                          <li key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">·</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 5: Practical Next Step */}
            {(() => {
              const nextStep = chain.practicalNextStep || (chain.nextSteps && chain.nextSteps[0]);
              if (!nextStep) return null;
              return (
                <div className="relative">
                  <div className="absolute -left-8 top-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                        Practical next step
                      </span>
                      {nextStep.isReversible && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Reversible
                        </span>
                      )}
                    </div>
                    <div className="p-3.5 rounded border-l-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                          {nextStep.title}
                        </h4>
                        {nextStep.recommendedTimeline && (
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {nextStep.recommendedTimeline}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {nextStep.description}
                      </p>
                      {nextStep.practicalAdvice && (
                        <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                          <strong className="text-slate-700 dark:text-slate-300 font-medium">Negotiation tip: </strong>
                          {nextStep.practicalAdvice}
                        </p>
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
