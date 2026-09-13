"use client";

import React from "react";
import type { LegalSource } from "@/types";
import { SOURCE_TYPE_PRIORITY, isSourceStale } from "@/lib/safety/legalSourceValidator";
import {
  X,
  ExternalLink,
  BookOpen,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";

interface SourceDetailModalProps {
  source: LegalSource | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceDetailModal({
  source,
  isOpen,
  onClose,
}: SourceDetailModalProps) {
  if (!isOpen || !source) return null;

  const priorityRank = SOURCE_TYPE_PRIORITY[source.sourceType] ?? 99;
  const isOfficial = priorityRank <= 4;
  const staleness = isSourceStale(source);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isOfficial
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {source.sourceType.replace(/_/g, " ")} (Priority #{priorityRank})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {source.id}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                {source.title}
              </h2>
              {source.publisher && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Published by {source.publisher}
                </p>
              )}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
                Jurisdiction
              </span>
              <div className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{source.jurisdiction}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
                Official Citation
              </span>
              <p className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {source.citation}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
                Retrieved At
              </span>
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{new Date(source.retrievedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {source.publicationDate && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Published Date
                </span>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{source.publicationDate}</span>
                </div>
              </div>
            )}

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
                Verification Status
              </span>
              <div className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                <span className="capitalize">{source.verificationStatus}</span>
              </div>
            </div>
          </div>

          {/* Time-Sensitivity Advisory */}
          {staleness.isStale && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="block font-semibold">Temporal Notice:</strong>
                {staleness.reason || "Legal standards may have evolved since this authority was recorded."}
              </div>
            </div>
          )}

          {/* Why Selected */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Why This Source Was Selected
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/40">
              {source.relevance}
            </p>
          </div>

          {/* Relevant Statutory / Case Excerpt */}
          {(source.relevantExcerpt || source.excerpt) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Authoritative Excerpt / Relevant Provision
              </h3>
              <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 dark:bg-slate-950 border border-slate-800 font-mono text-xs leading-relaxed">
                &ldquo;{source.relevantExcerpt || source.excerpt}&rdquo;
              </div>
            </div>
          )}

          {/* Contextual Notes */}
          {source.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Contextual Analysis Note
              </h3>
              <p className="text-slate-600 dark:text-slate-400 italic">
                {source.notes}
              </p>
            </div>
          )}

          {/* Strict Safety Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
            <strong>LawPilot Verification Standard:</strong> Authoritative legal sources are referenced for informational context only and do not establish attorney-client privilege or replace formal statutory research by licensed counsel.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          {(source.url || source.sourceUrl) && (
            <a
              href={source.url || source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
            >
              <span>Open Official Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
