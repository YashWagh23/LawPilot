"use client";

import React, { useState } from "react";
import type { AnalysisReport, Clause, EvidenceChain, EvidenceLink, Finding, JurisdictionContext } from "@/types";
import { EvidenceChainCard } from "@/components/evidence/EvidenceChainCard";
import { EvidenceChainDetailModal } from "@/components/evidence/EvidenceChainDetailModal";
import { SplitEvidenceView } from "@/components/evidence/SplitEvidenceView";
import { ClauseQAModal } from "@/components/analysis/ClauseQAModal";
import { SeverityBadge } from "@/components/evidence/SeverityBadge";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { JurisdictionIndicator } from "@/components/jurisdiction/JurisdictionIndicator";
import { formatJurisdictionBadge } from "@/lib/jurisdiction/jurisdictionDetector";
import {
  FileText,
  Layers,
  CheckSquare,
  Briefcase,
  Printer,
  ShieldCheck,
  DollarSign,
  Clock,
  Calendar,
  Eye,
  Columns,
  MessageSquare,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { ActionPlanView } from "@/components/action-plan/ActionPlan";
import { LawyerBriefView } from "@/components/lawyer-brief/LawyerBrief";
import { generateDeterministicActionPlan } from "@/lib/ai/agents/actionPlanningAgent";
import { generateDeterministicLawyerBrief } from "@/lib/ai/agents/lawyerBriefAgent";
import { formatDate } from "@/lib/utils";
import { AskLawPilotView } from "./AskLawPilotView";

interface AnalysisClientViewProps {
  report: AnalysisReport;
}

type ActiveTab = "overview" | "ask" | "act";
type ActSubTab = "actions" | "brief";

// Severity ordering for sorting findings
const SEVERITY_ORDER: Record<string, number> = {
  critical_attention: 0,
  high_attention: 1,
  review: 2,
  context_dependent: 3,
  informational: 4,
};

export function AnalysisClientView({ report }: AnalysisClientViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [actSubTab, setActSubTab] = useState<ActSubTab>("actions");

  // Document viewer selection
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(
    report.clauses[0]?.id || null
  );
  const [activeEvidenceLink, setActiveEvidenceLink] = useState<EvidenceLink | null>(
    report.evidenceLinks[0] || null
  );

  // Modal states
  const [selectedChainForModal, setSelectedChainForModal] = useState<EvidenceChain | null>(null);
  const [qaClause, setQaClause] = useState<Clause | null>(null);
  const [qaFinding, setQaFinding] = useState<Finding | null>(null);
  const [isQaOpen, setIsQaOpen] = useState(false);

  // Overview progressive-disclosure states
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showClauses, setShowClauses] = useState(false);
  const [showSplitView, setShowSplitView] = useState(false);
  const [showKeyNumbers, setShowKeyNumbers] = useState(false);

  // Jurisdiction
  const [jurisdictionContext, setJurisdictionContext] = useState<JurisdictionContext | undefined>(
    report.jurisdictionContext ||
      report.metadata.jurisdictionContext || {
        country: "India",
        stateOrUT: "Maharashtra",
        governingLaw: report.metadata.governingLaw || "Laws of the Republic of India",
        confidence: "high",
        source: "document",
        evidence: [
          "Section 12 specifies governing laws of the Republic of India.",
          "Exclusive jurisdiction of Mumbai courts.",
        ],
      }
  );

  const handleJumpToClause = (clauseId: string, link?: EvidenceLink) => {
    setSelectedClauseId(clauseId);
    setActiveEvidenceLink(link || report.evidenceLinks.find((l) => l.clauseId === clauseId) || null);
    setActiveTab("overview");
    const el = document.getElementById("document-viewer-container");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Sorted findings
  const sortedFindings = [...report.findings].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
  );

  // ──────────────────────────────────────────────────────
  // TAB CONFIG
  // ──────────────────────────────────────────────────────
  const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "ask",      label: "Ask LawPilot", icon: Sparkles },
    { id: "act",      label: "Act",          icon: CheckSquare },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

      {/* ══════════════════════════════════════════════════════
          DOCUMENT HEADER
      ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 sm:px-8">
          {/* Top row: label + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Document Intelligence
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                Isolation Passed
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {report.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <JurisdictionIndicator
                context={jurisdictionContext}
                verifiedSourceCount={report.evidenceChains.length}
                uncertaintyCount={report.findings.filter((f) => f.uncertainties && f.uncertainties.length > 0).length}
                onJurisdictionChange={setJurisdictionContext}
              />
              <button
                type="button"
                onClick={() => window.print()}
                title="Print / Export"
                className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            {report.metadata.title}
          </h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {report.metadata.fileName || "Uploaded Document"} · Processed {formatDate(report.createdAt)}
          </p>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            {report.metadata.parties && report.metadata.parties.length > 0 && (
              <span>
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">Parties:</strong>{" "}
                {report.metadata.parties.map((p) => `${p.name} (${p.role})`).join(" · ")}
              </span>
            )}
            <span>
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">Law:</strong>{" "}
              {formatJurisdictionBadge(jurisdictionContext)}
            </span>
            {report.metadata.pageCount && (
              <span>{report.metadata.pageCount} pages · {report.clauses.length} clauses</span>
            )}
            <span>{report.findings.length} findings</span>

            {/* Key numbers toggle */}
            <button
              type="button"
              onClick={() => setShowKeyNumbers(!showKeyNumbers)}
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Key Numbers
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showKeyNumbers ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Key numbers drawer */}
          {showKeyNumbers && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 lp-animate-slide-down">
              {report.financialTerms?.slice(0, 2).map((fin) => (
                <div key={fin.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-start gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block truncate">{fin.label}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{fin.formattedAmount}</span>
                  </div>
                </div>
              ))}
              {report.keyDates?.slice(0, 2).map((d) => (
                <div key={d.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-start gap-2">
                  {d.noticePeriodDays ? (
                    <Clock className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] text-slate-500 block truncate">{d.label}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {d.noticePeriodDays ? `${d.noticePeriodDays}d Notice` : d.date || "In document"}
                    </span>
                  </div>
                </div>
              ))}
              {(!report.financialTerms || report.financialTerms.length === 0) &&
               (!report.keyDates || report.keyDates.length === 0) && (
                <div className="col-span-4 text-xs text-slate-400 py-2">No specific financial terms extracted.</div>
              )}
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 sm:px-8">
          <nav className="flex -mb-px overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors duration-150 cursor-pointer shrink-0 ${
                    active
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === "ask" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                      AI
                    </span>
                  )}
                  {tab.id === "act" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                      ACT
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* ── Findings accordion list ── */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Clauses Requiring Attention
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {report.findings.length} findings · &ldquo;Important&rdquo; does not mean illegal.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">{report.findings.length} total</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedFindings.map((finding) => {
                const linkedChain = report.evidenceChains.find(
                  (c) => c.finding.id === finding.id || c.finding.clauseId === finding.clauseId
                );
                const isExpanded = expandedFindingId === finding.id;
                const verificationStatus = linkedChain?.verification?.status;
                const verificationLabel =
                  verificationStatus === "verified" ? "Verified"
                  : verificationStatus === "partially_verified" ? "Context dependent"
                  : verificationStatus === "conflicting" ? "Conflicting"
                  : "Not verified";

                return (
                  <div key={finding.id} className="group">
                    {/* ── Row (always visible) ── */}
                    <div
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-100 cursor-pointer"
                      onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                    >
                      <div className="shrink-0">
                        <SeverityBadge severity={finding.severity} />
                      </div>
                      <span className="flex-1 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug min-w-0 truncate">
                        {finding.title}
                      </span>
                      <span className="hidden sm:block text-[10px] font-mono text-slate-400 shrink-0">
                        {finding.evidence.section}
                      </span>

                      {/* Action buttons (visible on hover) */}
                      <div
                        className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (linkedChain) setSelectedChainForModal(linkedChain);
                          }}
                          title="See evidence chain"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          Why
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const matched = report.clauses.find((c) => c.id === finding.clauseId);
                            setQaClause(matched || null);
                            setQaFinding(finding);
                            setIsQaOpen(true);
                          }}
                          title="Ask about this clause"
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Ask
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJumpToClause(finding.clauseId, finding.evidence)}
                          title="View in document"
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>

                      <ChevronDown
                        className={`w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>

                    {/* ── Expanded detail ── */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 lp-animate-slide-down">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                          {finding.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px]">
                          <span className="text-slate-500">
                            Evidence:{" "}
                            <strong className="font-mono text-slate-700 dark:text-slate-300">
                              {finding.evidence.section}
                              {finding.evidence.pageNumber ? ` · Page ${finding.evidence.pageNumber}` : ""}
                            </strong>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              verificationLabel === "Verified"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : verificationLabel === "Context dependent"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : verificationLabel === "Conflicting"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {verificationLabel}
                          </span>
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={() => { if (linkedChain) setSelectedChainForModal(linkedChain); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              See why (Evidence Chain)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleJumpToClause(finding.clauseId, finding.evidence)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              View in document
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Document Viewer ── */}
          <div id="document-viewer-container" className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Document Viewer</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a clause to highlight its source excerpt.
              </p>
            </div>
            <div className="p-5">
              <DocumentViewer
                clauses={report.clauses}
                selectedClauseId={selectedClauseId}
                activeEvidenceLink={activeEvidenceLink}
                documentTitle={report.metadata.title}
                totalPageCount={report.metadata.pageCount}
                onSelectClause={(cid) => {
                  setSelectedClauseId(cid);
                  setActiveEvidenceLink(report.evidenceLinks.find((l) => l.clauseId === cid) || null);
                }}
              />
            </div>
          </div>

          {/* ── Progressive disclosure: Evidence Chains ── */}
          {report.evidenceChains && report.evidenceChains.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setShowEvidence(!showEvidence)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Transparent Evidence Chains
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {report.evidenceChains.length} chains — clause → legal principle → uncertainty → action
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showEvidence ? "rotate-180" : ""}`} />
              </button>
              {showEvidence && (
                <div className="px-6 pb-6 pt-2 space-y-4 border-t border-slate-100 dark:border-slate-800 lp-animate-slide-down">
                  {report.evidenceChains.map((chain) => (
                    <EvidenceChainCard key={chain.id} chain={chain} defaultExpanded={false} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Progressive disclosure: Split Evidence View ── */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSplitView(!showSplitView)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Columns className="w-4 h-4 text-violet-500" />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Split Evidence View
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Side-by-side clause and finding comparison
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showSplitView ? "rotate-180" : ""}`} />
            </button>
            {showSplitView && (
              <div className="border-t border-slate-100 dark:border-slate-800 lp-animate-slide-down">
                <SplitEvidenceView
                  clauses={report.clauses}
                  findings={report.findings}
                  evidenceChains={report.evidenceChains}
                  onAskQuestion={(clauseId, finding) => {
                    const matched = report.clauses.find((c) => c.id === clauseId);
                    setQaClause(matched || null);
                    setQaFinding(finding || null);
                    setIsQaOpen(true);
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Progressive disclosure: Extracted Clauses ── */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowClauses(!showClauses)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Extracted Clauses & Plain English
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {report.clauses.length} clauses — raw text alongside plain-language translations
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showClauses ? "rotate-180" : ""}`} />
            </button>
            {showClauses && (
              <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 lp-animate-slide-down">
                {report.clauses.map((clause) => (
                  <div key={clause.id} className="overflow-hidden">
                    <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-950/40">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {clause.section}: {clause.title}
                        {clause.pageNumber && (
                          <span className="text-slate-400 font-normal ml-1.5">(Page {clause.pageNumber})</span>
                        )}
                      </span>
                      <SeverityBadge severity={clause.importance} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                      <div className="p-5 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Original Language
                        </span>
                        <p className="font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                          {clause.rawText}
                        </p>
                      </div>
                      <div className="p-5 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Plain English
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {clause.plainEnglish}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: ASK LAWPILOT
      ══════════════════════════════════════════════════════ */}
      {activeTab === "ask" && (
        <AskLawPilotView
          report={report}
          onJumpToClause={(clauseId) => handleJumpToClause(clauseId)}
          onOpenChain={(chain) => setSelectedChainForModal(chain)}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: ACT (Action Plan + Lawyer Brief)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "act" && (
        <div className="space-y-4">
          {/* Sub-tab picker */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {(
              [
                { id: "actions" as ActSubTab, label: "Action Plan",   icon: CheckSquare },
                { id: "brief"   as ActSubTab, label: "Lawyer Brief",  icon: Briefcase },
              ] as { id: ActSubTab; label: string; icon: React.ElementType }[]
            ).map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActSubTab(sub.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    actSubTab === sub.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sub.label}
                </button>
              );
            })}
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
                const matched = report.findings.find((f) => f.id === findingId);
                if (matched) handleJumpToClause(matched.clauseId || matched.evidence?.clauseId, matched.evidence);
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
                const matched = report.findings.find((f) => f.id === findingId);
                if (matched) handleJumpToClause(matched.clauseId || matched.evidence?.clauseId, matched.evidence);
              }}
            />
          )}
        </div>
      )}

      {/* ── Modals (always mounted) ── */}
      <EvidenceChainDetailModal
        chain={selectedChainForModal}
        isOpen={!!selectedChainForModal}
        onClose={() => setSelectedChainForModal(null)}
        onViewInDocument={(clauseId) => handleJumpToClause(clauseId)}
      />
      <ClauseQAModal
        isOpen={isQaOpen}
        onClose={() => { setIsQaOpen(false); setQaClause(null); setQaFinding(null); }}
        clause={qaClause}
        finding={qaFinding}
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
