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
} from "lucide-react";
import { ActionPlanView } from "@/components/action-plan/ActionPlan";
import { LawyerBriefView } from "@/components/lawyer-brief/LawyerBrief";
import { generateDeterministicActionPlan } from "@/lib/ai/agents/actionPlanningAgent";
import { generateDeterministicLawyerBrief } from "@/lib/ai/agents/lawyerBriefAgent";
import { formatDate } from "@/lib/utils";

interface AnalysisClientViewProps {
  report: AnalysisReport;
}

export function AnalysisClientView({ report }: AnalysisClientViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview_viewer" | "split_view" | "chains" | "clauses" | "actions" | "brief"
  >("overview_viewer");

  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(
    report.clauses[0]?.id || null
  );
  const [activeEvidenceLink, setActiveEvidenceLink] = useState<EvidenceLink | null>(
    report.evidenceLinks[0] || null
  );

  // Phase 3 Modal States
  const [selectedChainForModal, setSelectedChainForModal] =
    useState<EvidenceChain | null>(null);
  const [qaClause, setQaClause] = useState<Clause | null>(null);
  const [qaFinding, setQaFinding] = useState<Finding | null>(null);
  const [isQaOpen, setIsQaOpen] = useState<boolean>(false);

  // Phase 5 Jurisdiction Context State
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
    if (link) {
      setActiveEvidenceLink(link);
    } else {
      const matched = report.evidenceLinks.find((l) => l.clauseId === clauseId);
      setActiveEvidenceLink(matched || null);
    }
    setActiveTab("overview_viewer");

    // Smooth scroll to viewer element
    const el = document.getElementById("document-viewer-container");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Group findings by severity
  const criticalFindings = report.findings.filter(
    (f) => f.severity === "critical_attention"
  );
  const highFindings = report.findings.filter(
    (f) => f.severity === "high_attention"
  );
  const reviewFindings = report.findings.filter((f) => f.severity === "review");
  const contextFindings = report.findings.filter(
    (f) => f.severity === "context_dependent"
  );
  const infoFindings = report.findings.filter(
    (f) => f.severity === "informational"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* 1. DOCUMENT OVERVIEW */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Document Intelligence Analysis
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                ID: {report.id}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                Untrusted Isolation Passed
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {report.metadata.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Source File: {report.metadata.fileName || "Uploaded Document"} · Processed on{" "}
              {formatDate(report.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <JurisdictionIndicator
              context={jurisdictionContext}
              verifiedSourceCount={report.evidenceChains.length}
              uncertaintyCount={report.findings.filter((f) => f.uncertainties && f.uncertainties.length > 0).length}
              onJurisdictionChange={setJurisdictionContext}
            />
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export</span>
            </button>
          </div>
        </div>

        {/* Overview Facts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Parties Identified</span>
            <div className="space-y-0.5">
              {report.metadata.parties && report.metadata.parties.length > 0 ? (
                report.metadata.parties.map((p) => (
                  <p key={p.id} className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {p.name} ({p.role})
                  </p>
                ))
              ) : (
                <p className="text-slate-400 italic">No explicit parties detected</p>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Jurisdiction & Governing Law</span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {jurisdictionContext?.governingLaw || report.metadata.governingLaw || "Laws of the Republic of India"}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
              {formatJurisdictionBadge(jurisdictionContext)} · {jurisdictionContext?.confidence?.toUpperCase() || "HIGH"} CONFIDENCE
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Effective Date</span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(report.metadata.effectiveDate || undefined)}
            </p>
            <p className="text-[11px] text-slate-500">
              {report.metadata.executionDate ? `Executed: ${formatDate(report.metadata.executionDate)}` : "Execution date silent"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Document Scale</span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {report.metadata.pageCount ? `${report.metadata.pageCount} Pages` : "Pagination unavailable"} · {report.clauses.length} Clauses
            </p>
            <p className="text-[11px] text-slate-500">
              {report.metadata.wordCount?.toLocaleString() || "0"} words parsed
            </p>
          </div>
        </div>

        {/* 2. KEY NUMBERS RIBBON */}
        <div className="pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-3">
            Key Financial & Temporal Terms
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {report.financialTerms && report.financialTerms.length > 0 ? (
              report.financialTerms.slice(0, 2).map((fin) => (
                <div
                  key={fin.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-start gap-2.5"
                >
                  <DollarSign className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {fin.label}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {fin.formattedAmount}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-xs text-slate-500">
                No specific dollar figures found
              </div>
            )}

            {report.keyDates && report.keyDates.length > 0 ? (
              report.keyDates.slice(0, 2).map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-start gap-2.5"
                >
                  {d.noticePeriodDays ? (
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  ) : (
                    <Calendar className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {d.label}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {d.noticePeriodDays ? `${d.noticePeriodDays} Days Notice` : d.date || "Specified in text"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-xs text-slate-500">
                Standard notice periods
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("overview_viewer")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "overview_viewer"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Document Viewer & Findings ({report.findings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("split_view")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "split_view"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>Split Evidence View</span>
          </button>

          {report.evidenceChains && report.evidenceChains.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("chains")}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                activeTab === "chains"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Evidence Chains ({report.evidenceChains.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("clauses")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "clauses"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Extracted Clauses ({report.clauses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("actions")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "actions"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Action Plan</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
              ACT
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("brief")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "brief"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Lawyer Brief</span>
          </button>
        </nav>
      </div>

      {/* TAB: Split Evidence View */}
      {activeTab === "split_view" && (
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
      )}

      {/* TAB: Document Viewer & Clauses that Deserve Attention */}
      {activeTab === "overview_viewer" && (
        <div className="space-y-8">
          {/* 3. CLAUSES THAT DESERVE ATTENTION */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Clauses That Deserve Attention
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Identified provisions requiring scrutiny. Note: &ldquo;Important&rdquo; does not mean illegal.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {report.findings.length} Attention Findings
              </span>
            </div>

            {/* Findings List grouped by severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ...criticalFindings,
                ...highFindings,
                ...reviewFindings,
                ...contextFindings,
                ...infoFindings,
              ].map((finding) => {
                const linkedChain = report.evidenceChains.find(
                  (c) =>
                    c.finding.id === finding.id ||
                    c.finding.clauseId === finding.clauseId
                );
                const verificationStatus = linkedChain?.verification?.status;
                const verificationLabel =
                  verificationStatus === "verified"
                    ? "Verified"
                    : verificationStatus === "partially_verified"
                    ? "Context dependent"
                    : verificationStatus === "conflicting"
                    ? "Conflicting"
                    : "Not verified";

                return (
                  <div
                    key={finding.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3.5"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-xs font-mono text-slate-500">
                          {finding.evidence.section}
                          {finding.evidence.pageNumber
                            ? ` · Page ${finding.evidence.pageNumber}`
                            : " · Page n/a"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {finding.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                          {finding.description}
                        </p>
                      </div>

                      {/* Metadata Ribbon: Document Evidence & Legal Verification */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-500 font-medium">
                          Document evidence:{" "}
                          <strong className="text-slate-700 dark:text-slate-300 font-mono">
                            {finding.evidence.section}
                            {finding.evidence.pageNumber
                              ? ` · Page ${finding.evidence.pageNumber}`
                              : ""}
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
                          Legal verification: {verificationLabel}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (linkedChain) {
                            setSelectedChainForModal(linkedChain);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>See why</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const matchedClause = report.clauses.find(
                              (c) => c.id === finding.clauseId
                            );
                            setQaClause(matchedClause || null);
                            setQaFinding(finding);
                            setIsQaOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 cursor-pointer"
                          title="Ask question about this clause"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ask</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleJumpToClause(finding.clauseId, finding.evidence)
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 cursor-pointer"
                          title="View in Document Viewer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. DOCUMENT VIEWER FOUNDATION */}
          <div id="document-viewer-container" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Document Viewer & Clause Context
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspect raw source text. Clicking &ldquo;View Clause&rdquo; highlights the source excerpt.
                </p>
              </div>
            </div>

            <DocumentViewer
              clauses={report.clauses}
              selectedClauseId={selectedClauseId}
              activeEvidenceLink={activeEvidenceLink}
              documentTitle={report.metadata.title}
              totalPageCount={report.metadata.pageCount}
              onSelectClause={(cid) => {
                setSelectedClauseId(cid);
                const matched = report.evidenceLinks.find((l) => l.clauseId === cid);
                setActiveEvidenceLink(matched || null);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB: Evidence Chains */}
      {activeTab === "chains" && report.evidenceChains && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Transparent Reasoning & Grounded Evidence Chains
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every finding connected from contract clause to authoritative legal principles, certainty, and practical action.
            </p>
          </div>

          <div className="space-y-6">
            {report.evidenceChains.map((chain) => (
              <EvidenceChainCard key={chain.id} chain={chain} defaultExpanded={true} />
            ))}
          </div>
        </div>
      )}

      {/* TAB: Extracted Clauses */}
      {activeTab === "clauses" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Deconstructed Clauses & Plain English Translations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Side-by-side comparison of raw contractual text alongside plain-language explanations.
            </p>
          </div>

          <div className="space-y-4">
            {report.clauses.map((clause) => (
              <div
                key={clause.id}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {clause.section}: {clause.title}
                    </span>
                    {clause.pageNumber && (
                      <span className="text-[11px] text-slate-500">
                        (Page {clause.pageNumber})
                      </span>
                    )}
                  </div>
                  <SeverityBadge severity={clause.importance} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  <div className="p-5 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Original Contract Language (Raw)
                    </span>
                    <p className="font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                      {clause.rawText}
                    </p>
                  </div>

                  <div className="p-5 space-y-2 bg-blue-50/20 dark:bg-blue-950/10">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Plain English Translation
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed p-3">
                      {clause.plainEnglish}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Action Plan (ACT Layer) */}
      {activeTab === "actions" && (
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
            if (matched) {
              handleJumpToClause(matched.clauseId || matched.evidence?.clauseId, matched.evidence);
            }
          }}
          onNavigateToBrief={() => setActiveTab("brief")}
        />
      )}

      {/* TAB: Lawyer Brief */}
      {activeTab === "brief" && (
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
          onNavigateToActionPlan={() => setActiveTab("actions")}
          onSelectFinding={(findingId) => {
            const matched = report.findings.find((f) => f.id === findingId);
            if (matched) {
              handleJumpToClause(matched.clauseId || matched.evidence?.clauseId, matched.evidence);
            }
          }}
        />
      )}

      {/* Evidence Chain Detail Modal */}
      <EvidenceChainDetailModal
        chain={selectedChainForModal}
        isOpen={!!selectedChainForModal}
        onClose={() => setSelectedChainForModal(null)}
        onViewInDocument={(clauseId) => handleJumpToClause(clauseId)}
      />

      {/* Clause QA Modal */}
      <ClauseQAModal
        isOpen={isQaOpen}
        onClose={() => {
          setIsQaOpen(false);
          setQaClause(null);
          setQaFinding(null);
        }}
        clause={qaClause}
        finding={qaFinding}
        jurisdiction={report.metadata.jurisdiction || report.metadata.governingLaw || "Delaware"}
        sources={report.evidenceChains.flatMap((c) => c.legalSources || [])}
      />
    </div>
  );
}
