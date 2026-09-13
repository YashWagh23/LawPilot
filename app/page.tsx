import React from "react";
import Link from "next/link";
import {
  FileText,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { SAMPLE_EVIDENCE_CHAINS } from "@/lib/demo/sampleAnalysis";
import { EvidenceChainCard } from "@/components/evidence/EvidenceChainCard";

export default function HomePage() {
  const previewChain = SAMPLE_EVIDENCE_CHAINS[0];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Core Principle Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs mb-6 tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 dark:text-blue-600" />
            <span>LawPilot · Understand. Verify. Act.</span>
          </div>

          {/* Exact Required Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            Legal documents weren&apos;t written for humans.
            <br />
            <span className="text-blue-600 dark:text-blue-400">LawPilot was.</span>
          </h1>

          {/* Core Problem & Purpose Statement */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Deconstruct complex legal agreements into plain English, verify statutory context against official legal authorities, and determine practical, reversible next steps.
          </p>

          {/* Primary Frictionless Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/analysis/demo-employment-agreement"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Try the Demo</span>
              <span className="text-[11px] font-normal px-1.5 py-0.5 rounded bg-blue-700/80 text-blue-100">
                🇮🇳 India Flagship
              </span>
            </Link>

            <Link
              href="/review"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Analyze a Document</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </Link>
          </div>

          {/* Instant Operational Guarantees */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Zero User Login Required
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Untrusted Document Isolation
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Grounded Statutory Context
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Zero Citation Fabrication
            </span>
          </div>

          {/* 4 Instant Value Pillars (Communicates in Seconds) */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/70 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                01 · WHAT IT DOES
              </span>
              <h3 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                Translates Legalese
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Deconstructs agreements into plain English clauses, defined terms, and explicit financial obligations.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/70 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                02 · REAL DOCUMENTS
              </span>
              <h3 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                PDF · DOCX · TXT Intake
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Processes real agreements up to 15MB with server-side magic-byte validation and prompt-injection safety.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/70 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                03 · LEGAL RESEARCH
              </span>
              <h3 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                Verified Legal Context
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Detects jurisdiction and grounds risks in official statutory repositories (India Code, Supreme Court) with zero hallucinations.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/70 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                04 · PRACTICAL ACTION
              </span>
              <h3 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                Reversible Next Steps
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Generates actionable negotiation checklists, copyable scripts, and a structured Lawyer-Ready Brief.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section: UNDERSTAND -> VERIFY -> ACT */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            The Core Framework
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            How LawPilot transforms legal complexity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: UNDERSTAND */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900/60 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Step 01
                </span>
                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  EXTRACTION & TRIAGE
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                UNDERSTAND
              </h3>
              <p className="mt-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                See the clauses that matter.
              </p>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Deconstruct dense legal agreements into structured clauses, identify defined parties, extract financial obligations, and translate legalese into clear, plain English.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              Risk categorization: High Attention · Review · Context Dependent
            </div>
          </div>

          {/* Pillar 2: VERIFY */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900/60 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Step 02
                </span>
                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  GROUNDED EVIDENCE
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                VERIFY
              </h3>
              <p className="mt-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                Connect findings to reliable legal sources.
              </p>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ground every risk in verbatim contract language and authoritative legal principles. Transparently display confidence levels, factual dependencies, and what is still unknown.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              Zero hallucinated citations · Mandatory factual dependency checks
            </div>
          </div>

          {/* Pillar 3: ACT */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900/60 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Step 03
                </span>
                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  PRAGMATIC STEPS
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                ACT
              </h3>
              <p className="mt-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                Turn uncertainty into practical next steps.
              </p>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Receive pragmatic, reversible action items, concrete negotiation phrasing, and a concise Lawyer-Ready Brief to maximize the efficiency of professional counsel consultations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              Reversible next steps · Structured attorney briefing exports
            </div>
          </div>
        </div>
      </section>

      {/* Signature Differentiator Feature: The Evidence Chain */}
      <section className="py-14 bg-slate-100/70 border-y border-slate-200 dark:bg-slate-900/40 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Signature Differentiator</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                The Evidence Chain in action
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                AI output is only as trustworthy as the reasoning behind it. Every LawPilot finding connects finding to contract clause, authoritative source, uncertainty, and practical action.
              </p>
            </div>

            <Link
              href="/analysis/demo-employment-agreement"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 shrink-0 transition-colors"
            >
              <span>Explore full employment agreement analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Evidence Chain Card Preview */}
          <EvidenceChainCard chain={previewChain} defaultExpanded={true} />
        </div>
      </section>

      {/* Two Entry Points Teaser */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Entry Point 1 */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                1. Document Review
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Upload a lease, employment agreement, NDA, or vendor contract. LawPilot isolates high-friction clauses, cross-checks statutory context, and flags one-sided liabilities.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Full party & date extraction
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Plain English clause translation
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Lawyer-Ready Brief compilation
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link
                href="/review"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span>Upload document for review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Entry Point 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                2. Situation Navigator
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                No contract in hand? Describe an ongoing dispute, unpaid invoice, or workplace conflict. LawPilot identifies the issue, pinpoints missing facts, and outlines practical options.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  Targeted follow-up questions
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  Evidence checklist to preserve
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  Questions to ask a licensed attorney
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link
                href="/situation"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span>Describe your situation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
