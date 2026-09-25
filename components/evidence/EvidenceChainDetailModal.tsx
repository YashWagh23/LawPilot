"use client";

import React, { useState } from "react";
import type { EvidenceChain, JurisdictionContext, LegalSource, ReportVerificationState } from "@/types";
import { SeverityBadge } from "./SeverityBadge";
import { SourceDetailModal } from "./SourceDetailModal";
import {
  X,
  FileText,
  BookOpen,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Eye,
  GitCompare,
  ExternalLink,
} from "lucide-react";
import { formatJurisdictionBadge } from "@/lib/jurisdiction/jurisdictionDetector";
import { getChainVerificationBadge, VERIFICATION_TONE_CLASSES } from "@/lib/analysis/verificationState";

interface EvidenceChainDetailModalProps {
  chain: EvidenceChain | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInDocument?: (clauseId: string) => void;
  documentJurisdiction?: JurisdictionContext;
  reportVerificationState?: ReportVerificationState;
}

export function EvidenceChainDetailModal({
  chain,
  isOpen,
  onClose,
  onViewInDocument,
  documentJurisdiction,
  reportVerificationState,
}: EvidenceChainDetailModalProps) {
  const [inspectedSource, setInspectedSource] = useState<LegalSource | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !chain) return null;

  const docEvidence = chain.documentEvidence;
  const primarySource = chain.legalSources?.[0] || chain.legalSource;
  const claims = chain.legalClaims || [];
  const primaryClaim = claims[0];
  const verification = chain.verification;
  const isConflict = verification?.status === "conflicting";
  const verificationBadge = getChainVerificationBadge(chain);
  const effectiveJurisdiction = chain.jurisdictionContext || documentJurisdiction;
  const isChainUnverified =
    reportVerificationState?.tone === "unverified" ||
    verificationBadge.tone === "unverified" ||
    !primarySource;

  const nextStep =
    chain.practicalNextStep || (chain.nextSteps && chain.nextSteps[0]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evidence-chain-modal-title"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Why LawPilot Flagged This
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-mono">
                  {chain.finding.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <SeverityBadge severity={chain.finding.severity} />
                <h2 id="evidence-chain-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {chain.finding.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
                  JURISDICTION:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {effectiveJurisdiction
                    ? formatJurisdictionBadge(effectiveJurisdiction)
                    : primarySource?.jurisdiction || "Jurisdiction not established"}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
                  LEGAL CONTEXT:
                </span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded ${VERIFICATION_TONE_CLASSES[verificationBadge.tone].pill}`}
                  title={verificationBadge.detail}
                >
                  {verificationBadge.label}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Signature Evidence Chain Progression */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
            {/* Visual Step Timeline */}
            <div className="relative pl-6 sm:pl-8 space-y-7 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">

              {/* LAYER 1: DOCUMENT EVIDENCE */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      1. Document Evidence
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {docEvidence.section}
                        {docEvidence.pageNumber ? ` · Page ${docEvidence.pageNumber}` : ""}
                      </span>
                      {onViewInDocument && (
                        <button
                          type="button"
                          onClick={() => {
                            onViewInDocument(docEvidence.clauseId);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                        >
                          <span>View in Document</span>
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 p-3.5 rounded-xl bg-amber-500/5 border-l-3 border-amber-500 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed dark:bg-amber-950/20">
                    &ldquo;{docEvidence.quotedText || docEvidence.exactQuote}&rdquo;
                  </div>
                </div>
              </div>

              {/* LAYER 2: LEGAL CONTEXT */}
              <div className="relative">
                <div className={`absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  primarySource
                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                    : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}>
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      primarySource ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"
                    }`}>
                      2. {primarySource ? "Supported Legal Context" : "Legal Context & Authority"}
                    </span>
                    {primarySource && primaryClaim?.supportLevel ? (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        {primaryClaim.supportLevel.replace("_", " ")} support
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        insufficient context
                      </span>
                    )}
                  </div>

                  {primarySource ? (
                    <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80 space-y-2.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectedSource(primarySource)}
                          className="text-left group cursor-pointer"
                        >
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors inline-flex items-center gap-1.5">
                            <span>{primarySource.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {primarySource.citation}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500">
                              {primarySource.jurisdiction}
                            </span>
                          </div>
                        </button>
                      </div>

                      {primaryClaim?.explanation && (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {primaryClaim.explanation}
                        </p>
                      )}

                      {(primarySource.relevantExcerpt || primarySource.excerpt) && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs italic text-slate-600 dark:text-slate-400">
                          &ldquo;{primarySource.relevantExcerpt || primarySource.excerpt}&rdquo;
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 italic">
                      Not verified: insufficient legal context. Sufficient authoritative verification was not found in the designated jurisdiction.
                    </div>
                  )}
                </div>
              </div>

              {/* LAYER 3: VERIFICATION GATE RESULT */}
              <div className="relative">
                <div className={`absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  verificationBadge.tone === "verified"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                    : verificationBadge.tone === "partial"
                    ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                }`}>
                  {verificationBadge.tone === "verified" ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      3. Verification Status
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        VERIFICATION_TONE_CLASSES[verificationBadge.tone].pill
                      }`}
                    >
                      {verificationBadge.tone === "unverified"
                        ? "NOT VERIFIED"
                        : verification?.status?.replace("_", " ") || verificationBadge.label.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({(verificationBadge.tone === "unverified" ? "insufficient" : (verification?.confidenceLevel || chain.confidence?.level || "high")).toUpperCase()} CONFIDENCE)
                    </span>
                  </div>

                  {/* Conflicting Authority Indicator if detected */}
                  {isConflict && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1.5 text-xs text-purple-900 dark:text-purple-200">
                      <div className="flex items-center gap-1.5 font-bold">
                        <GitCompare className="w-4 h-4 text-purple-600" />
                        <span>Sources Differ On This Issue</span>
                      </div>
                      <p>
                        Because authorities appear to differ or the doctrine is split across jurisdictions, professional legal review is advised.
                      </p>
                    </div>
                  )}

                  {verification?.issues && verification.issues.length > 0 && !isConflict && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {verification.issues.map((iss, idx) => (
                        <p key={idx}>• {iss}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LAYER 4: WHAT THIS DOES NOT TELL YOU */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-xs font-semibold">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                    4. What This Does Not Tell You
                  </span>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    LawPilot cannot determine definitive enforceability from the clause text alone because court outcomes depend on factual inquiries outside the four corners of this agreement.
                  </div>
                </div>
              </div>

              {/* LAYER 5: WHAT WOULD CHANGE THE ANALYSIS */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    5. What Would Change The Analysis
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                      <li>
                        <strong>Governing Jurisdiction:</strong> Whether a dispute is heard under the designated governing law or the law where a party is based.
                      </li>
                      <li>
                        <strong>Party Roles:</strong> Each party’s position, bargaining power, and access to sensitive information.
                      </li>
                      <li>
                        <strong>Applicable Law & Statutes:</strong> Specific statutory exceptions (e.g. wage deduction thresholds, prior invention carve-outs).
                      </li>
                      <li>
                        <strong>Specific Factual Circumstances:</strong> Actual expenditures incurred, remote work location, or mutual agreement history.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* LAYER 6: PRACTICAL NEXT STEP */}
              {nextStep && (
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        6. Practical Next Step
                      </span>
                      {nextStep.isReversible && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-semibold">
                          Reversible Action
                        </span>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-bold">{nextStep.title}</h4>
                        <span className="text-xs text-slate-400">
                          {nextStep.recommendedTimeline}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {nextStep.description}
                      </p>
                      {nextStep.practicalAdvice && (
                        <div className="pt-2 border-t border-slate-800 dark:border-slate-700 text-xs text-slate-300">
                          <strong className="text-white">Counsel Negotiation Phrasing: </strong>
                          {nextStep.practicalAdvice}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              {isChainUnverified
                ? "LawPilot Evidence Chain · Factual clause analysis (no verified legal authority)"
                : "LawPilot Evidence Chain · Grounded in verifiable legal authority"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold transition-colors"
            >
              Done Reviewing Chain
            </button>
          </div>
        </div>
      </div>

      {/* Nested Source Detail Inspector Modal */}
      <SourceDetailModal
        source={inspectedSource}
        isOpen={!!inspectedSource}
        onClose={() => setInspectedSource(null)}
      />
    </>
  );
}
