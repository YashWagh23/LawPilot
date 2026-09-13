import React from "react";
import Link from "next/link";
import { getRecentDocuments } from "@/lib/storage/reportStore";
import { FileText, ArrowUpRight, Clock, ShieldAlert, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export async function RecentActivity() {
  const documents = await getRecentDocuments();

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Recent Matters & Documents
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            Loaded from workspace history
          </p>
        </div>
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          {documents.length} Matters
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {doc.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-700 dark:text-slate-300">
                  <span>{doc.fileName}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(doc.uploadedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              {doc.status === "analyzed" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3" />
                  Report Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  <ShieldAlert className="w-3 h-3" />
                  Pending Review
                </span>
              )}

              {doc.analysisId ? (
                <Link
                  href={`/analysis/${doc.analysisId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition-colors"
                >
                  View Report
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href={`/review?doc=${doc.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                >
                  Inspect
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
