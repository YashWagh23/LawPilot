"use client";

import React, { useState } from "react";
import type { Clause, EvidenceChain, Finding, LegalSource } from "@/types";
import { SeverityBadge } from "./SeverityBadge";
import { SourceDetailModal } from "./SourceDetailModal";
import { getChainVerificationBadge, VERIFICATION_TONE_CLASSES } from "@/lib/analysis/verificationState";
import {
  FileText,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

interface SplitEvidenceViewProps {
  clauses: Clause[];
  findings: Finding[];
  evidenceChains: EvidenceChain[];
  initialFindingId?: string;
  onAskQuestion?: (clauseId: string, finding?: Finding) => void;
}

export function SplitEvidenceView({
  clauses,
  findings,
  evidenceChains,
  initialFindingId,
  onAskQuestion,
}: SplitEvidenceViewProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    initialFindingId || findings[0]?.id || ""
  );
  const [inspectedSource, setInspectedSource] = useState<LegalSource | null>(null);

  const activeFinding =
    findings.find((f) => f.id === selectedFindingId) || findings[0];
  const activeChain = evidenceChains.find(
    (c) => c.finding.id === activeFinding?.id || c.finding.clauseId === activeFinding?.clauseId
  );
  const activeClause =
    clauses.find((c) => c.id === activeFinding?.clauseId) ||
    clauses.find((c) => c.id === activeChain?.documentEvidence.clauseId) ||
    clauses[0];

  const primarySource = activeChain?.legalSources?.[0] || activeChain?.legalSource;
  const primaryClaim = activeChain?.legalClaims?.[0];
  const nextStep = activeChain?.practicalNextStep || activeChain?.nextSteps?.[0];

  const quoteToHighlight =
    activeChain?.documentEvidence.quotedText ||
    activeFinding?.evidence?.quotedText ||
    "";

  // Highlight quoted substring inside rawText
  const renderHighlightedText = (text: string, quote: string) => {
    if (!quote || !text) return text;
    const cleanQuote = quote.trim();
    const idx = text.indexOf(cleanQuote);
    if (idx === -1) {
      // Fuzzy fallback: attempt matching first 40 chars
      const subQuote = cleanQuote.slice(0, 40);
      const subIdx = text.indexOf(subQuote);
      if (subIdx === -1) return text;
      return (
        <>
          {text.slice(0, subIdx)}
          <mark className="bg-amber-200 dark:bg-amber-900/60 text-slate-950 dark:text-amber-100 rounded px-1 py-0.5 font-medium">
            {text.slice(subIdx, subIdx + cleanQuote.length)}
          </mark>
          {text.slice(subIdx + cleanQuote.length)}
        </>
      );
    }

    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber-200 dark:bg-amber-900/60 text-slate-950 dark:text-amber-100 rounded px-1 py-0.5 font-medium">
          {text.slice(idx, idx + cleanQuote.length)}
        </mark>
        {text.slice(idx + cleanQuote.length)}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Finding Selector Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Select Finding:
        </span>
        {findings.map((f) => {
          const isSelected = f.id === activeFinding?.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFindingId(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="truncate max-w-[200px]">{f.title}</span>
              <SeverityBadge severity={f.severity} />
            </button>
          );
        })}
      </div>

      {/* Side-By-Side Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch min-h-[520px]">
        {/* LEFT PANEL: ACTUAL CONTRACT CLAUSE */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Actual Contract Clause
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeClause?.section}: {activeClause?.title}
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Page {activeClause?.pageNumber || "n/a"}
              </span>
            </div>

            {/* Verbatim Clause Text with Highlight */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed overflow-y-auto max-h-[360px]">
              {renderHighlightedText(activeClause?.rawText || "", quoteToHighlight)}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block w-2.5 h-2.5 rounded bg-amber-300 dark:bg-amber-600" />
              <span>Highlighted portion constitutes flagged evidence</span>
            </div>
          </div>

          {onAskQuestion && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Have questions about how this clause applies?
              </span>
              <button
                type="button"
                onClick={() => onAskQuestion(activeClause?.id || "", activeFinding)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask a Question</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: RELEVANT LEGAL CONTEXT & REASONING */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/20 dark:border-blue-900/50 dark:bg-blue-950/10 p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                    Supported Legal Context
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeFinding?.title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${VERIFICATION_TONE_CLASSES[activeChain ? getChainVerificationBadge(activeChain).tone : "unverified"].text}`} />
                <span className={`text-xs font-semibold ${VERIFICATION_TONE_CLASSES[activeChain ? getChainVerificationBadge(activeChain).tone : "unverified"].text}`}>
                  {activeChain ? getChainVerificationBadge(activeChain).label : "Not verified"}
                </span>
              </div>
            </div>

            {/* Authoritative Source Card */}
            {primarySource ? (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {primarySource.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        {primarySource.citation}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{primarySource.jurisdiction}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedSource(primarySource)}
                    className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    title="Inspect Source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {primaryClaim?.explanation || primarySource.relevance}
                </p>

                {(primarySource.relevantExcerpt || primarySource.excerpt) && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] italic text-slate-500 dark:text-slate-400">
                    &ldquo;{primarySource.relevantExcerpt || primarySource.excerpt}&rdquo;
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-500 italic">
                Sufficient authoritative verification was not found in the designated jurisdiction.
              </div>
            )}

            {/* Uncertainty / What We Cannot Determine */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Fact-Dependent Elements:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                {activeChain?.uncertainties?.[0] ||
                  activeFinding?.uncertainties?.[0] ||
                  "Enforceability depends heavily on specific circumstances outside the document text."}
              </p>
            </div>

            {/* Practical Next Step */}
            {nextStep && (
              <div className="p-3 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Recommended Next Step:</span>
                  <span className="text-[10px] text-slate-400">
                    {nextStep.recommendedTimeline}
                  </span>
                </div>
                <p className="text-slate-300">{nextStep.description}</p>
                {nextStep.practicalAdvice && (
                  <div className="pt-1.5 border-t border-slate-800 dark:border-slate-700 text-[11px] text-slate-300">
                    <strong className="text-white">Negotiation Tip:</strong>{" "}
                    {nextStep.practicalAdvice}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs text-slate-500">
            <span>Visual Evidence Mapping</span>
            <span className="font-mono text-[11px]">Clause ↔ Legal Standard</span>
          </div>
        </div>
      </div>

      {/* Source Detail Modal */}
      <SourceDetailModal
        source={inspectedSource}
        isOpen={!!inspectedSource}
        onClose={() => setInspectedSource(null)}
      />
    </div>
  );
}
