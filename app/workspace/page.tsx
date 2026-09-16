import React from "react";
import Link from "next/link";
import {
  FileText,
  Compass,
  GitCompare,
  ArrowRight,
  Shield,
  FileCheck,
  Sparkles,
  Search,
} from "lucide-react";
import { RecentActivity } from "@/components/workspace/RecentActivity";

export default function WorkspacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              LawPilot Workspace
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              Active Environment
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Select an intake pathway or inspect recently analyzed legal matters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/analysis/demo-employment-agreement"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Inspect Sample Report</span>
          </Link>
          <Link
            href="/review"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-xs font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Document Review</span>
          </Link>
        </div>
      </div>

      {/* Primary Action Choice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Choice 1: Document Review */}
        <Link
          href="/review"
          className="group relative rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Primary Pathway
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Review a Document
            </h2>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Upload PDF, DOCX, or TXT agreements. Extract clauses, identify one-sided risks, and generate an Evidence Chain.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
            <span>Upload or load sample</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Choice 2: Situation Navigator */}
        <Link
          href="/situation"
          className="group relative rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Advisory Intake
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Describe a Situation
            </h2>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Describe a legal issue or dispute without uploading files. Detect missing facts, review legal principles, and build a checklist.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
            <span>Narrate matter facts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Choice 3: Compare Versions */}
        <Link
          href="/compare"
          className="group relative rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:scale-105 transition-transform">
                <GitCompare className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Redline Diff
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
              Compare Document Versions
            </h2>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Compare two agreement drafts to identify modified terms, newly inserted obligations, and shifted liability risk.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
            <span>Redline analysis</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Workspace Status & Safe Sandbox Callout */}
      <div className="rounded-xl border border-slate-200 bg-slate-100/50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Untrusted Content Isolation & Safe Grounding Active
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Uploaded files are sanitized against prompt injection. AI output is constrained to verified evidence without fabricated citations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0">
          <span className="flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-blue-500" />
            Zero-Auth, Local-First
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-indigo-500" />
            Evidence Chain v1.0
          </span>
        </div>
      </div>

      {/* Recent Activity List */}
      <div>
        <RecentActivity />
      </div>
    </div>
  );
}
