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
import { formatJurisdictionBadge } from "@/lib/jurisdiction/jurisdictionDetector";
import {
  Sparkles,
  Printer,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  CheckSquare,
  Briefcase,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { ActionPlanView } from "@/components/action-plan/ActionPlan";
import { LawyerBriefView } from "@/components/lawyer-brief/LawyerBrief";
import { generateDeterministicActionPlan } from "@/lib/ai/agents/actionPlanningAgent";
import { generateDeterministicLawyerBrief } from "@/lib/ai/agents/lawyerBriefAgent";
import { AskLawPilotView } from "./AskLawPilotView";

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

  // Jurisdiction
  const [jurisdictionContext] = useState<JurisdictionContext | undefined>(
    report.jurisdictionContext ||
      report.metadata.jurisdictionContext || {
        country: "India",
        stateOrUT: "Maharashtra",
        governingLaw: report.metadata.governingLaw || "Laws of the Republic of India",
        confidence: "high",
        source: "document",
      }
  );

  // Transform findings into clean Presentation models
  const presentationFindings = useMemo(() => {
    return report.findings.map((f) => toFindingPresentation(f, report));
  }, [report]);

  // Current active finding presentation
  const activeFinding = useMemo(() => {
    return (
      presentationFindings.find((f) => f.id === activeFindingId) ||
      presentationFindings[0] ||
      null
    );
  }, [presentationFindings, activeFindingId]);

  // Handle jump to clause in document viewer
  const handleJumpToClause = (clauseId: string) => {
    const matchedFinding = presentationFindings.find((f) => f.clauseId === clauseId);
    if (matchedFinding) {
      setActiveFindingId(matchedFinding.id);
    }
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
          1. MINIMAL, CALM DOCUMENT HEADER
          Answers: What document is this? Where is it from?
      ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Subtle Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">Document</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              {formatJurisdictionBadge(jurisdictionContext)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            title="Print or Export summary"
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / Export</span>
          </button>
        </div>

        {/* Document Title & Headline (The 3-Second Test) */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {report.metadata.title}
          </h1>
          <p className="mt-2 text-base sm:text-lg font-medium text-indigo-600 dark:text-indigo-400">
            {`LawPilot found ${presentationFindings.length} ${presentationFindings.length === 1 ? "thing" : "things"} worth your attention.`}
          </p>
        </div>

        {/* Navigation Tabs: Overview | Ask LawPilot | Next Steps */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ask")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "ask"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Ask LawPilot</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("act");
              setActSubTab("actions");
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "act"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>Next Steps</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: OVERVIEW (LAYER 1 ESSENTIALS)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-10">
          {/* ── Section: Important Issues (Prioritized Finding Cards) ── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Important Issues
              </h2>
              <span className="text-xs text-slate-400">
                Prioritized by impact
              </span>
            </div>

            <div className="space-y-3">
              {presentationFindings.map((finding) => {
                const isSelectedForPreview = activeFindingId === finding.id;

                return (
                  <div
                    key={finding.id}
                    onClick={() => setActiveFindingId(finding.id)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelectedForPreview
                        ? "border-indigo-500/50 bg-indigo-50/20 dark:border-indigo-500/40 dark:bg-indigo-950/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 shadow-xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Severity + Title + Value + One-sentence summary */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              finding.severityLabel === "HIGH"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                                : finding.severityLabel === "MEDIUM"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                            }`}
                          >
                            {finding.severityLabel}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {finding.clauseReference}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {finding.title}
                          </h3>
                          {finding.keyValue && (
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                              · {finding.keyValue}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {finding.summary}
                        </p>
                      </div>

                      {/* Right: Single clear action button */}
                      <div className="shrink-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFindingForModal(finding);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                        >
                          <span>Why this matters</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Section: What Should I Do Next? (Direct Next Action Bar) ── */}
          <section className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200/60 dark:border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ready to take action?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ask questions in plain English or follow your step-by-step preparation plan.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("ask")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ask LawPilot</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("act");
                  setActSubTab("actions");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>See Action Plan</span>
              </button>
            </div>
          </section>

          {/* ── Section: Contextual Document Passage (Layer 2) ── */}
          <section id="document-section-anchor" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Document Passage
              </h2>
              <button
                type="button"
                onClick={() => setShowFullDocViewer(!showFullDocViewer)}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <span>{showFullDocViewer ? "Hide Document Viewer" : "Open Full Document Viewer"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFullDocViewer ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Contextual snippet of the currently selected issue */}
            {activeFinding && !showFullDocViewer && (
              <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3 lp-animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {activeFinding.clauseReference}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {activeFinding.title}
                    </span>
                    {activeFinding.keyValue && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        ({activeFinding.keyValue})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFindingForModal(activeFinding)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Why this matters →
                  </button>
                </div>

                <blockquote className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  &ldquo;{activeFinding.whatContractSays}&rdquo;
                </blockquote>
              </div>
            )}

            {/* Full Document Viewer when expanded */}
            {showFullDocViewer && (
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden lp-animate-slide-down">
                <DocumentViewer
                  clauses={report.clauses}
                  selectedClauseId={activeFinding?.clauseId || report.clauses[0]?.id}
                  activeEvidenceLink={report.evidenceLinks.find((l) => l.clauseId === activeFinding?.clauseId) || null}
                  documentTitle={report.metadata.title}
                  totalPageCount={report.metadata.pageCount}
                  onSelectClause={(cid) => {
                    const matched = presentationFindings.find((f) => f.clauseId === cid);
                    if (matched) setActiveFindingId(matched.id);
                  }}
                />
              </div>
            )}
          </section>

          {/* ── Section: Why Should I Trust This? (Layer 3 Progressive Evidence) ── */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFullEvidence(!showFullEvidence)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
            >
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Why should I trust this?
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>Document Passage</span>
                  <span className="text-slate-300 dark:text-slate-600">→</span>
                  <span>Factual Evidence</span>
                  <span className="text-slate-300 dark:text-slate-600">→</span>
                  <span>Legal Authority</span>
                  <span className="text-slate-300 dark:text-slate-600">→</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified Grounding</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>{showFullEvidence ? "Hide evidence" : "Show full evidence"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFullEvidence ? "rotate-180" : ""}`} />
              </div>
            </button>

            {showFullEvidence && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 lp-animate-slide-down">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every issue detected by LawPilot links back to the original clause, statutory authorities (e.g. Indian Contract Act Section 27, Payment of Gratuity Act), and explicit uncertainty boundaries.
                </p>
                <div className="space-y-4">
                  {report.evidenceChains.map((chain) => (
                    <EvidenceChainCard key={chain.id} chain={chain} defaultExpanded={false} />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Section: Extracted Clauses (Progressive Disclosure) ── */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExtractedClauses(!showExtractedClauses)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
            >
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  All Extracted Clauses ({report.clauses.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View raw clauses alongside plain English summaries.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>{showExtractedClauses ? "Hide clauses" : "Show all clauses"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExtractedClauses ? "rotate-180" : ""}`} />
              </div>
            </button>

            {showExtractedClauses && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 lp-animate-slide-down">
                {report.clauses.map((clause) => (
                  <div key={clause.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {clause.section}: {clause.title}
                        {clause.pageNumber && (
                          <span className="text-slate-400 font-normal ml-1.5">(Page {clause.pageNumber})</span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {clause.plainEnglish}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Concise Legal Disclaimer ── */}
          <div className="text-center pt-2 pb-6">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              LawPilot provides legal information and document assistance, not legal advice.{" "}
              <button
                type="button"
                onClick={() => setShowLegalDisclosure(!showLegalDisclosure)}
                className="text-slate-600 dark:text-slate-400 underline hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Full legal disclosure
              </button>
            </p>

            {showLegalDisclosure && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-left text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 lp-animate-fade-in max-w-xl mx-auto space-y-1.5">
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
        <AskLawPilotView
          report={report}
          onJumpToClause={(clauseId) => handleJumpToClause(clauseId)}
          onOpenChain={(chain) => setSelectedChainForModal(chain)}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: NEXT STEPS (Action Plan + Lawyer Brief)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "act" && (
        <div className="space-y-6">
          {/* Sub-tab picker */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActSubTab("actions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                actSubTab === "actions"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Next Steps</span>
            </button>

            <button
              type="button"
              onClick={() => setActSubTab("brief")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                actSubTab === "brief"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>Prepare for a Lawyer</span>
            </button>
          </div>

          {/* Action Plan */}
          {actSubTab === "actions" && (
            <ActionPlanView
              actionPlan={
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
              }
              onSelectFinding={(findingId) => {
                const matched = presentationFindings.find((f) => f.id === findingId);
                if (matched) handleJumpToClause(matched.clauseId);
              }}
              onNavigateToBrief={() => setActSubTab("brief")}
            />
          )}

          {/* Lawyer Brief */}
          {actSubTab === "brief" && (
            <LawyerBriefView
              brief={
                report.detailedLawyerBrief ||
                generateDeterministicLawyerBrief({
                  documentId: report.documentId,
                  documentTitle: report.metadata.title,
                  documentType: report.metadata.documentType,
                  date: report.metadata.effectiveDate || undefined,
                  parties: report.metadata.parties.map((p) => p.name),
                  jurisdiction: report.metadata.jurisdiction || report.metadata.governingLaw || undefined,
                  documentSummary: report.summary.keyTakeaway,
                  findings: report.findings,
                  clauses: report.clauses,
                  evidenceChains: report.evidenceChains,
                  keyDates: report.keyDates,
                  actionPlan: report.actionPlan,
                })
              }
              onNavigateToActionPlan={() => setActSubTab("actions")}
              onSelectFinding={(findingId) => {
                const matched = presentationFindings.find((f) => f.id === findingId);
                if (matched) handleJumpToClause(matched.clauseId);
              }}
            />
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
        onAskLawPilot={(_q) => {
          setActiveTab("ask");
        }}
        onViewEvidenceChain={(chain) => {
          if (chain) setSelectedChainForModal(chain);
        }}
      />

      <EvidenceChainDetailModal
        chain={selectedChainForModal}
        isOpen={!!selectedChainForModal}
        onClose={() => setSelectedChainForModal(null)}
        onViewInDocument={(clauseId) => handleJumpToClause(clauseId)}
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
