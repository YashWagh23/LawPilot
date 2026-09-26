"use client";

import React, { useState, useMemo } from "react";
import type {
  AnalysisReport,
  Clause,
  EvidenceChain,
  JurisdictionContext,
} from "@/types";
import {
  toFindingPresentation,
  type FindingPresentation,
} from "@/lib/analysis/presentationTransformer";
import { FindingDetailModal } from "./FindingDetailModal";
import { EvidenceChainDetailModal } from "@/components/evidence/EvidenceChainDetailModal";
import { EvidenceChainCard } from "@/components/evidence/EvidenceChainCard";
import { ClauseQAModal } from "@/components/analysis/ClauseQAModal";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { formatJurisdictionBadge, getReportJurisdiction } from "@/lib/jurisdiction/jurisdictionDetector";
import type { QuestionFocus } from "@/lib/ai/ask/relevance";
import {
  Printer,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Handshake,
} from "lucide-react";
import { ActionPlanView } from "@/components/action-plan/ActionPlan";
import { LawyerBriefView } from "@/components/lawyer-brief/LawyerBrief";
import { generateDeterministicActionPlan } from "@/lib/analysis/deterministicActionPlan";
import { generateDeterministicLawyerBrief } from "@/lib/analysis/deterministicLawyerBrief";
import { isHeuristicReport } from "@/lib/analysis/analysisSummary";
import { getReportVerificationState, VERIFICATION_TONE_CLASSES } from "@/lib/analysis/verificationState";
import { AskLawPilotView } from "./AskLawPilotView";
import { NegotiationCopilotModal } from "@/components/negotiation/NegotiationCopilotModal";

interface AnalysisClientViewProps {
  report: AnalysisReport;
}

type ActiveTab = "overview" | "ask" | "act";
type ActSubTab = "actions" | "brief";

export function AnalysisClientView({ report }: AnalysisClientViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [actSubTab, setActSubTab] = useState<ActSubTab>("actions");

  // Selected finding for Layer 2 detail modal
  const [selectedFindingForModal, setSelectedFindingForModal] =
    useState<FindingPresentation | null>(null);

  // Active finding for contextual preview in Document section
  const [activeFindingId, setActiveFindingId] = useState<string>(
    report.findings[0]?.id || ""
  );

  // Clause chosen directly in the full document viewer (independent of any finding)
  const [viewerClauseId, setViewerClauseId] = useState<string | null>(null);
  const passageRef = React.useRef<HTMLElement | null>(null);

  // Progressive disclosure toggles for Layer 3
  const [showFullDocViewer, setShowFullDocViewer] = useState(false);
  const [showFullEvidence, setShowFullEvidence] = useState(false);
  const [showExtractedClauses, setShowExtractedClauses] = useState(false);
  const [showLegalDisclosure, setShowLegalDisclosure] = useState(false);

  // Modals
  const [selectedChainForModal, setSelectedChainForModal] =
    useState<EvidenceChain | null>(null);
  const [qaClause, setQaClause] = useState<Clause | null>(null);
  const [qaFinding, setQaFinding] = useState<FindingPresentation | null>(null);
  const [isQaOpen, setIsQaOpen] = useState(false);
  const [negotiationFinding, setNegotiationFinding] =
    useState<FindingPresentation | null>(null);

  // A question (and the clause/finding it is about) handed over from another part of the UI.
  const [pendingAsk, setPendingAsk] = useState<{
    question: string;
    focus?: QuestionFocus;
    nonce: number;
  } | null>(null);

  // Jurisdiction: exactly what the analysis established. Never defaults to a country.
  const jurisdictionContext: JurisdictionContext = getReportJurisdiction(report);

  // Verification: reflects what the evidence chains actually verified (never assumed).
  const verification = useMemo(() => getReportVerificationState(report), [report]);

  // Transform findings into clean Presentation models, highest severity first
  // (stable sort keeps document order within the same tier)
  const presentationFindings = useMemo(() => {
    const tierRank = { HIGH: 0, MEDIUM: 1, REVIEW: 2, INFO: 3 } as const;
    return report.findings
      .map((f) => toFindingPresentation(f, report))
      .sort((a, b) => tierRank[a.severityLabel] - tierRank[b.severityLabel]);
  }, [report]);

  // Current active finding presentation
  const activeFinding = useMemo(() => {
    return (
      presentationFindings.find((f) => f.id === activeFindingId) ||
      presentationFindings[0] ||
      null
    );
  }, [presentationFindings, activeFindingId]);

  // Memoized action plan (uses report.actionPlan or client-safe deterministic fallback)
  const resolvedActionPlan = useMemo(() => {
    return (
      report.actionPlan ||
      generateDeterministicActionPlan({
        documentId: report.documentId,
        documentTitle: report.metadata.title,
        documentSummary: report.summary.keyTakeaway,
        parties: report.metadata.parties.map((p) => p.name),
        jurisdiction: report.metadata.jurisdiction || report.metadata.governingLaw || undefined,
        findings: report.findings,
        evidenceChains: report.evidenceChains,
        keyDates: report.keyDates,
      })
    );
  }, [report]);

  // Memoized lawyer brief (uses report.detailedLawyerBrief or client-safe deterministic fallback)
  const resolvedLawyerBrief = useMemo(() => {
    return (
      report.detailedLawyerBrief ||
      generateDeterministicLawyerBrief({
        documentId: report.documentId,
        documentTitle: report.metadata.title,
        documentType: report.metadata.documentType,
        date: report.metadata.effectiveDate || undefined,
        parties: report.metadata.parties.map((p) => p.name),
        jurisdiction: formatJurisdictionBadge(jurisdictionContext),
        jurisdictionContext,
        documentSummary: report.summary.keyTakeaway,
        findings: report.findings,
        clauses: report.clauses,
        evidenceChains: report.evidenceChains,
        keyDates: report.keyDates,
        actionPlan: report.actionPlan,
        heuristic: isHeuristicReport(report),
      })
    );
  }, [report, jurisdictionContext]);

  // Selecting a finding syncs the Document Passage panel (and the full viewer) to its clause.
  const handleSelectFinding = (findingId: string) => {
    setActiveFindingId(findingId);
    setViewerClauseId(null);
    // If the passage panel is entirely below the fold, bring it into view so the sync is visible.
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const el = passageRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight - 40) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
  };

  // Handle jump to clause in document viewer
  const handleJumpToClause = (clauseId: string) => {
    const matchedFinding = presentationFindings.find((f) => f.clauseId === clauseId);
    if (matchedFinding) {
      setActiveFindingId(matchedFinding.id);
    }
    setViewerClauseId(null);
    setShowFullDocViewer(true);
    setActiveTab("overview");
    setTimeout(() => {
      const el = document.getElementById("document-section-anchor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* ══════════════════════════════════════════════════════
          1. DOCUMENT HEADER
      ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Metadata row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-200">Document</span>
            <span aria-hidden="true">·</span>
            <span>{formatJurisdictionBadge(jurisdictionContext)}</span>
            <span aria-hidden="true">·</span>
            <span
              className={`inline-flex items-center gap-1 font-medium ${VERIFICATION_TONE_CLASSES[verification.tone].text}`}
              title={verification.detail}
              data-testid="verification-badge"
              data-verification-state={verification.tone}
            >
              {verification.tone === "verified" ? (
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ShieldAlert className="w-3 h-3" aria-hidden="true" />
              )}
              {verification.label}
            </span>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            title="Print or Export summary"
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Document title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white lp-text-balance">
            {report.metadata.title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {presentationFindings.length} {presentationFindings.length === 1 ? "issue" : "issues"} flagged for your attention
          </p>
        </div>

        {/* Navigation Tabs — text-only, weight-based active state */}
        <div role="tablist" aria-label="Analysis sections" className="flex items-center gap-0 border-b border-slate-200 dark:border-slate-800">
          {([
            { id: "overview", label: "Overview" },
            { id: "ask",      label: "Ask LawPilot" },
            { id: "act",      label: "Next Steps" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "act") setActSubTab("actions");
              }}
              className={`px-4 py-2.5 text-xs border-b-2 transition-all cursor-pointer shrink-0 min-h-[44px] ${
                activeTab === tab.id
                  ? "border-slate-900 dark:border-white font-semibold text-slate-900 dark:text-white"
                  : "border-transparent font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ══════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div
          role="tabpanel"
          id="tabpanel-overview"
          aria-labelledby="tab-overview"
          className="space-y-10"
        >
          {/* ── Section: Findings (divider list, not cards) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Findings · prioritized by impact
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              {presentationFindings.map((finding) => {
                const isActive = activeFindingId === finding.id;

                return (
                  <div
                    key={finding.id}
                    className="lp-finding-row bg-white dark:bg-slate-900"
                    data-active={isActive}
                  >
                    {/*
                     * Two sibling <button> elements — no nesting:
                     * Left: activates the finding → Document Passage panel updates
                     * Right: opens the detail modal
                     * This satisfies both WCAG (no interactive-in-interactive) and product UX.
                     */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0">
                      {/* Left area — sets active finding (updates Document Passage) */}
                      <button
                        type="button"
                        onClick={() => handleSelectFinding(finding.id)}
                        aria-pressed={isActive}
                        aria-label={`Select ${finding.severityLabel} severity finding: ${finding.title}`}
                        className="flex-1 min-w-0 text-left p-4 sm:pl-5 sm:py-5 sm:pr-2"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                finding.severityLabel === "HIGH"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                                  : finding.severityLabel === "MEDIUM"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              }`}
                            >
                              {finding.severityLabel}
                            </span>
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {finding.clauseReference}
                            </span>
                            {finding.keyValue && (
                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                {finding.keyValue}
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                            {finding.title}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed lp-text-pretty">
                            {finding.summary}
                          </p>
                        </div>
                      </button>

                      {/* Right area — opens the detail modal (and the Negotiation Copilot for material findings) */}
                      <div className="shrink-0 px-4 sm:px-5 pb-3 sm:pb-0 flex items-center gap-4">
                        {(finding.severityLabel === "HIGH" || finding.severityLabel === "MEDIUM") && (
                          <button
                            type="button"
                            onClick={() => setNegotiationFinding(finding)}
                            aria-label={`Negotiate: ${finding.title}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer py-1"
                          >
                            <Handshake className="w-3 h-3" aria-hidden="true" />
                            Negotiate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedFindingForModal(finding)}
                          aria-label={`View full details for: ${finding.title}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-1"
                        >
                          Why this matters
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Section: Next actions prompt (plain, no gradient) ── */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Ready to take action?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ask questions in plain English or follow your step-by-step preparation plan.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("ask")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px]"
              >
                Ask LawPilot
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("act"); setActSubTab("actions"); }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-slate-900 text-xs font-semibold text-white dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors cursor-pointer min-h-[36px]"
              >
                Action plan
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </section>

          {/* ── Section: Document Passage ── */}
          <section id="document-section-anchor" ref={passageRef} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Document passage
              </p>
              <button
                type="button"
                onClick={() => setShowFullDocViewer(!showFullDocViewer)}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <span>{showFullDocViewer ? "Hide viewer" : "Full document"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFullDocViewer ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Contextual snippet of the currently selected issue */}
            {activeFinding && !showFullDocViewer && (
              <div className="space-y-2 lp-animate-fade-in" aria-live="polite" data-testid="document-passage">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {activeFinding.clauseReference}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {activeFinding.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFindingForModal(activeFinding)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-auto"
                  >
                    Why this matters →
                  </button>
                </div>

                <blockquote className="lp-quote">
                  &ldquo;{activeFinding.whatContractSays}&rdquo;
                </blockquote>
              </div>
            )}

            {/* Full Document Viewer when expanded */}
            {showFullDocViewer && (
              <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden lp-animate-slide-down">
                <DocumentViewer
                  clauses={report.clauses}
                  selectedClauseId={viewerClauseId || activeFinding?.clauseId || report.clauses[0]?.id}
                  activeEvidenceLink={
                    (!viewerClauseId || viewerClauseId === activeFinding?.clauseId
                      ? report.evidenceLinks.find((l) => l.findingId === activeFinding?.id) ||
                        report.evidenceLinks.find((l) => l.clauseId === activeFinding?.clauseId)
                      : null) || null
                  }
                  documentTitle={report.metadata.title}
                  totalPageCount={report.metadata.pageCount}
                  onSelectClause={(cid) => {
                    setViewerClauseId(cid);
                    const matched = presentationFindings.find((f) => f.clauseId === cid);
                    if (matched) setActiveFindingId(matched.id);
                  }}
                />
              </div>
            )}
          </section>

          {/* ── Section: Evidence Chain (progressive disclosure) ── */}
          <section className="border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowFullEvidence(!showFullEvidence)}
              className="w-full flex items-center justify-between py-4 hover:opacity-75 transition-opacity cursor-pointer text-left"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Why should I trust this?
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span>Document quote</span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">→</span>
                  <span>Legal authority</span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">→</span>
                  <span>Certainty assessment</span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">→</span>
                  <span className={`font-medium ${VERIFICATION_TONE_CLASSES[verification.tone].text}`}>
                    {verification.tone === "verified"
                      ? "Verified grounding"
                      : verification.tone === "partial"
                      ? "Partially verified grounding"
                      : "Not verified: insufficient legal context"}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0 ml-4">
                <span>{showFullEvidence ? "Hide" : "Show evidence"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFullEvidence ? "rotate-180" : ""}`} />
              </span>
            </button>

            {showFullEvidence && (
              <div className="pb-4 space-y-4 lp-animate-slide-down">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Every issue detected by LawPilot links back to the original clause, statutory authorities, and explicit uncertainty boundaries.
                </p>
                <div className="space-y-4">
                  {report.evidenceChains.map((chain) => (
                    <EvidenceChainCard
                      key={chain.id}
                      chain={chain}
                      defaultExpanded={false}
                      documentJurisdiction={jurisdictionContext}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Section: Extracted Clauses ── */}
          <section className="border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowExtractedClauses(!showExtractedClauses)}
              className="w-full flex items-center justify-between py-4 hover:opacity-75 transition-opacity cursor-pointer text-left"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  All extracted clauses ({report.clauses.length})
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Raw text alongside plain English summaries.
                </p>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0 ml-4">
                <span>{showExtractedClauses ? "Hide" : "Show clauses"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showExtractedClauses ? "rotate-180" : ""}`} />
              </span>
            </button>

            {showExtractedClauses && (
              <div className="pb-4 divide-y divide-slate-100 dark:divide-slate-800 lp-animate-slide-down">
                {report.clauses.map((clause) => (
                  <div key={clause.id} className="py-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {clause.section}: {clause.title}
                      </span>
                      {clause.pageNumber && (
                        <span className="text-slate-400">· p.{clause.pageNumber}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed lp-text-pretty">
                      {clause.plainEnglish}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Concise Legal Disclaimer ── */}
          <div className="pt-2 pb-6">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              LawPilot provides legal information and document assistance, not legal advice.{" "}
              <button
                type="button"
                onClick={() => setShowLegalDisclosure(!showLegalDisclosure)}
                className="underline hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                Full disclosure
              </button>
            </p>

            {showLegalDisclosure && (
              <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 lp-animate-fade-in space-y-1.5 max-w-xl">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Important Disclosure:</p>
                <p>
                  LawPilot is an automated legal intelligence tool designed to help you understand contractual agreements, identify potential exposure, and prepare for discussions with counsel or HR. It is not a law firm and does not substitute for licensed legal representation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: ASK LAWPILOT
      ══════════════════════════════════════════════════════ */}
      {activeTab === "ask" && (
        <div
          role="tabpanel"
          id="tabpanel-ask"
          aria-labelledby="tab-ask"
        >
          <AskLawPilotView
            report={report}
            initialAsk={pendingAsk}
            onAskConsumed={() => setPendingAsk(null)}
            onJumpToClause={(clauseId) => handleJumpToClause(clauseId)}
            onOpenChain={(chain) => setSelectedChainForModal(chain)}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: NEXT STEPS (Action Plan + Lawyer Brief)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "act" && (
        <div role="tabpanel" id="tabpanel-act" aria-labelledby="tab-act" className="space-y-6">
          {/* Sub-tab picker */}
          <div role="tablist" aria-label="Next steps sections" className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {([
              { id: "actions", label: "Next Steps" },
              { id: "brief",   label: "Prepare for a Lawyer" },
            ] as const).map((sub) => (
              <button
                key={sub.id}
                type="button"
                role="tab"
                id={`subtab-${sub.id}`}
                aria-selected={actSubTab === sub.id}
                aria-controls={`subtabpanel-${sub.id}`}
                onClick={() => setActSubTab(sub.id)}
                className={`px-4 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                  actSubTab === sub.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Action Plan */}
          {actSubTab === "actions" && (
            <div role="tabpanel" id="subtabpanel-actions" aria-labelledby="subtab-actions">
              <ActionPlanView
                actionPlan={resolvedActionPlan}
                documentId={report.documentId || report.id}
                onSelectFinding={(findingId) => {
                  const matched = presentationFindings.find((f) => f.id === findingId);
                  if (matched) handleJumpToClause(matched.clauseId);
                }}
                onNavigateToBrief={() => setActSubTab("brief")}
              />
            </div>
          )}

          {/* Lawyer Brief */}
          {actSubTab === "brief" && (
            <div role="tabpanel" id="subtabpanel-brief" aria-labelledby="subtab-brief">
              <LawyerBriefView
                brief={resolvedLawyerBrief}
                documentId={report.documentId || report.id}
                onNavigateToActionPlan={() => setActSubTab("actions")}
                onSelectFinding={(findingId) => {
                  const matched = presentationFindings.find((f) => f.id === findingId);
                  if (matched) handleJumpToClause(matched.clauseId);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}
      <FindingDetailModal
        finding={selectedFindingForModal}
        isOpen={!!selectedFindingForModal}
        onClose={() => setSelectedFindingForModal(null)}
        onJumpToClause={(clauseId) => handleJumpToClause(clauseId)}
        onAskLawPilot={(question, f) => {
          setPendingAsk({ question, focus: { findingId: f.id, clauseId: f.clauseId }, nonce: Date.now() });
          setActiveTab("ask");
        }}
        onViewEvidenceChain={(chain) => {
          if (chain) setSelectedChainForModal(chain);
        }}
        onNegotiate={(finding) => setNegotiationFinding(finding)}
      />

      <NegotiationCopilotModal
        report={report}
        finding={negotiationFinding}
        isOpen={!!negotiationFinding}
        onClose={() => setNegotiationFinding(null)}
        onViewEvidenceChain={(chain) => setSelectedChainForModal(chain)}
        onOpenActionPlan={() => { setActiveTab("act"); setActSubTab("actions"); }}
        onOpenLawyerBrief={() => { setActiveTab("act"); setActSubTab("brief"); }}
      />

      <EvidenceChainDetailModal
        chain={selectedChainForModal}
        isOpen={!!selectedChainForModal}
        onClose={() => setSelectedChainForModal(null)}
        onViewInDocument={(clauseId) => handleJumpToClause(clauseId)}
        documentJurisdiction={jurisdictionContext}
        reportVerificationState={verification}
      />

      <ClauseQAModal
        isOpen={isQaOpen}
        onClose={() => {
          setIsQaOpen(false);
          setQaClause(null);
          setQaFinding(null);
        }}
        clause={qaClause}
        finding={report.findings.find((f) => f.id === qaFinding?.id) || null}
        jurisdiction={
          report.metadata.jurisdiction ||
          report.metadata.governingLaw ||
          report.jurisdictionContext?.country ||
          "Applicable Law"
        }
        sources={report.evidenceChains.flatMap((c) => c.legalSources || [])}
      />
    </div>
  );
}
