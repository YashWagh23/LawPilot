"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AnalysisReport, EvidenceChain, NegotiationDraft } from "@/types";
import type { FindingPresentation } from "@/lib/analysis/presentationTransformer";
import {
  buildNegotiationInputFromReport,
  generateNegotiationDraft,
} from "@/lib/negotiation/negotiationEngine";
import {
  removeNegotiationDraft,
  saveNegotiationDraft,
  useSavedNegotiationDrafts,
} from "@/lib/negotiation/negotiationStore";
import {
  ArrowRight,
  BookmarkCheck,
  Check,
  Copy,
  Handshake,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

interface NegotiationCopilotModalProps {
  report: AnalysisReport;
  finding: FindingPresentation | null;
  isOpen: boolean;
  onClose: () => void;
  onViewEvidenceChain?: (chain: EvidenceChain) => void;
  onOpenActionPlan?: () => void;
  onOpenLawyerBrief?: () => void;
}

export function NegotiationCopilotModal({
  report,
  finding,
  isOpen,
  onClose,
  ...rest
}: NegotiationCopilotModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) modalRef.current.focus();
  }, [isOpen]);

  if (!isOpen || !finding) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="negotiation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs lp-animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Keyed so all draft state resets when a different finding is opened */}
        <NegotiationCopilotBody key={finding.id} report={report} finding={finding} onClose={onClose} {...rest} />
      </div>
    </div>
  );
}

/** Background AI refinement status; the grounded draft is shown regardless. */
type RefinementStatus = "refining" | "refined" | "unavailable";

function NegotiationCopilotBody({
  report,
  finding,
  onClose,
  onViewEvidenceChain,
  onOpenActionPlan,
  onOpenLawyerBrief,
}: Omit<NegotiationCopilotModalProps, "isOpen" | "finding"> & { finding: FindingPresentation }) {
  // The grounded deterministic draft is computed synchronously so it renders immediately.
  // The body is keyed by finding id, so this initializer runs once per finding.
  const [localInput] = useState(() => buildNegotiationInputFromReport(report, finding.id));
  const [draft, setDraft] = useState<NegotiationDraft | null>(() =>
    localInput ? generateNegotiationDraft(localInput) : null
  );
  const [refinement, setRefinement] = useState<RefinementStatus>("refining");
  const [copied, setCopied] = useState<string | null>(null);

  const documentId = report.documentId || report.id;
  const savedDrafts = useSavedNegotiationDrafts(documentId);
  const isSaved = savedDrafts.some((d) => d.findingId === finding.id);

  // Latest saved flag for the async callback: once the user has saved the grounded draft, a late
  // refinement must not silently change what is on screen versus what was saved.
  const isSavedRef = useRef(isSaved);
  useEffect(() => {
    isSavedRef.current = isSaved;
  }, [isSaved]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/analysis/negotiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        reportId: report.id,
        findingId: finding.id,
        clientContext: localInput
          ? {
              finding: localInput.finding,
              clause: localInput.clause,
              evidenceChain: localInput.evidenceChain,
              documentType: localInput.documentType,
              parties: localInput.parties,
              jurisdiction: localInput.jurisdiction,
            }
          : undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        // The server only returns "ai_assisted" after the rewrite passed schema, citation, and safety
        // validation; anything else means the grounded draft stands.
        const refined = data?.success && data.draft?.generationMode === "ai_assisted";
        if (refined && !isSavedRef.current) {
          setDraft(data.draft as NegotiationDraft);
          setRefinement("refined");
        } else if (!refined && !draft && data?.success && data.draft) {
          // No local input (finding only known to the server): use the server's grounded draft.
          setDraft(data.draft as NegotiationDraft);
          setRefinement("unavailable");
        } else {
          setRefinement(refined ? "refined" : "unavailable");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setRefinement("unavailable");
      });

    return () => controller.abort();
    // Runs once per mounted finding; `draft` is read only as the initial fallback check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, finding.id, localInput]);

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
              <Handshake className="w-3 h-3" aria-hidden="true" />
              Negotiation Copilot
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{finding.clauseReference}</span>
          </div>
          <h2
            id="negotiation-modal-title"
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug"
          >
            {finding.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Negotiation Copilot"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Draft notice — always visible, never collapsible */}
      <div
        role="note"
        className="mx-4 sm:mx-6 mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200"
      >
        <TriangleAlert className="w-4 h-4 mt-px shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          <span className="font-semibold">Draft for review, not legal advice.</span>{" "}
          Suggested wording is generated from your document and this finding&apos;s Evidence Chain. It has not been
          checked for legal correctness or enforceability.
        </p>
      </div>

      {/* Background refinement status — informational only, never blocks the draft */}
      <p
        className="mx-4 sm:mx-6 mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"
        role="status"
        aria-live="polite"
      >
        {refinement === "refining" && (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true" />
            Refining wording with AI…
          </>
        )}
        {refinement === "refined" && draft?.generationMode === "ai_assisted" && (
          <>
            <Sparkles className="w-3 h-3 text-indigo-500" aria-hidden="true" />
            AI-refined and validated
          </>
        )}
        {refinement === "unavailable" && <>AI refinement unavailable · showing grounded draft</>}
      </p>

      {/* Body */}
      <div
        className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 divide-y divide-slate-100 dark:divide-slate-800/80"
        aria-live="polite"
      >
        {!draft ? (
          <div className="space-y-3" aria-label="Preparing negotiation draft">
            <p className="text-xs text-slate-500 dark:text-slate-400">Preparing a grounded draft…</p>
            {[92, 80, 86, 60].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* 1. The issue */}
            <Section label="The negotiation issue">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed lp-text-pretty">
                {draft.issueExplanation}
              </p>
            </Section>

            {/* 2. Current vs proposed */}
            <Section label="Current wording" className="pt-5">
              <blockquote className="lp-quote">&ldquo;{draft.grounding.documentQuote}&rdquo;</blockquote>
            </Section>

            <Section
              label="Suggested revised clause"
              badge="Draft"
              className="pt-5"
              action={
                <CopyButton
                  label="Copy clause"
                  copied={copied === "clause"}
                  onClick={() => copy("clause", draft.proposedClause)}
                />
              }
            >
              <p className="rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {draft.proposedClause}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {draft.proposedClauseRationale}
              </p>
            </Section>

            {/* 3. Fallback */}
            <Section label="Fallback position / compromise" className="pt-5">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed lp-text-pretty">
                {draft.fallbackPosition}
              </p>
            </Section>

            {/* 4. Message */}
            <Section
              label={`Message to ${draft.message.recipient}`}
              badge="Draft"
              className="pt-5"
              action={
                <CopyButton
                  label="Copy message"
                  copied={copied === "message"}
                  onClick={() => copy("message", `Subject: ${draft.message.subject}\n\n${draft.message.body}`)}
                />
              }
            >
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p>
                  <span className="font-semibold text-slate-900 dark:text-white">Subject:</span> {draft.message.subject}
                </p>
                <p className="leading-relaxed whitespace-pre-line">{draft.message.body}</p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Replace the [bracketed] placeholders and read it through before sending.
              </p>
            </Section>

            {/* 5. Verify before accepting */}
            <Section label="Verify before accepting any change" className="pt-5">
              <ul className="space-y-1.5">
                {draft.verifyBeforeAccepting.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* 6. Grounding */}
            <Section label="What this draft is based on" className="pt-5">
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Document</span>
                  <span>
                    {draft.grounding.section}
                    {draft.grounding.pageNumber ? ` · Page ${draft.grounding.pageNumber}` : ""} (quoted above)
                  </span>
                </li>
                {draft.grounding.legalBasis.length > 0 ? (
                  draft.grounding.legalBasis.map((b) => (
                    <li key={b.sourceId} className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Source</span>
                      <span>
                        {b.citation}{" "}
                        <span
                          className={`ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            b.verificationStatus === "verified"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {String(b.verificationStatus).replace(/_/g, " ")}
                        </span>
                        {b.claim && <span className="block mt-0.5 text-slate-500 dark:text-slate-400">{b.claim}</span>}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Source</span>
                    <span>
                      No verified legal source is linked to this finding. This draft relies only on the contract text.
                    </span>
                  </li>
                )}
              </ul>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {draft.generationMode === "ai_assisted"
                  ? "Wording refined by AI, then checked so it cites no authority outside the Evidence Chain."
                  : "Generated from LawPilot's grounded templates. No new legal authority was added."}
              </p>
            </Section>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          {finding.evidenceChain && onViewEvidenceChain && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewEvidenceChain(finding.evidenceChain!);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer min-h-[36px]"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              View Evidence Chain
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
          {isSaved ? (
            <>
              <button
                type="button"
                onClick={() => removeNegotiationDraft(documentId, finding.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer min-h-[44px]"
              >
                Remove from Next Steps
              </button>
              {onOpenActionPlan && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenActionPlan();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-xs min-h-[44px]"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  Saved · Open Next Steps
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              disabled={!draft}
              onClick={() => draft && saveNegotiationDraft(draft)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs min-h-[44px]"
            >
              <Handshake className="w-3.5 h-3.5" aria-hidden="true" />
              Add to Action Plan &amp; Lawyer Brief
            </button>
          )}
          {isSaved && onOpenLawyerBrief && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLawyerBrief();
              }}
              className="inline-flex items-center justify-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer min-h-[36px] px-1"
            >
              Lawyer Brief
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Section({
  label,
  badge,
  action,
  className = "",
  children,
}: {
  label: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
          {badge && (
            <span className="normal-case tracking-normal text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900">
              {badge} · review before use
            </span>
          )}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function CopyButton({ label, copied, onClick }: { label: string; copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0 min-h-[28px]"
    >
      {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
      {copied ? "Copied" : label}
    </button>
  );
}
