"use client";

import React, { useRef } from "react";
import {
  Upload,
  FileText,
  ArrowRightLeft,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface UploadedDocState {
  file: File | null;
  displayName: string;
  sizeBytes?: number;
  isDemo?: boolean;
}

interface DualDocumentUploaderProps {
  previousDoc: UploadedDocState;
  currentDoc: UploadedDocState;
  onSelectPrevious: (file: File) => void;
  onSelectCurrent: (file: File) => void;
  onClearPrevious: () => void;
  onClearCurrent: () => void;
  onSwapVersions: () => void;
  onCompare: () => void;
  isComparing: boolean;
  errorMessage?: string | null;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "Standard doc";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DualDocumentUploader: React.FC<DualDocumentUploaderProps> = ({
  previousDoc,
  currentDoc,
  onSelectPrevious,
  onSelectCurrent,
  onClearPrevious,
  onClearCurrent,
  onSwapVersions,
  onCompare,
  isComparing,
  errorMessage,
}) => {
  const prevInputRef = useRef<HTMLInputElement>(null);
  const currInputRef = useRef<HTMLInputElement>(null);

  const handlePrevDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectPrevious(e.dataTransfer.files[0]);
    }
  };

  const handleCurrDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectCurrent(e.dataTransfer.files[0]);
    }
  };

  const isReadyToCompare =
    (previousDoc.file !== null || previousDoc.isDemo) &&
    (currentDoc.file !== null || currentDoc.isDemo);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* PREVIOUS VERSION Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                PREVIOUS VERSION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Baseline Draft
              </span>
            </div>
            {previousDoc.displayName && (
              <button
                type="button"
                onClick={onClearPrevious}
                aria-label="Remove previous document"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
                title="Clear previous document"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            type="file"
            ref={prevInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onSelectPrevious(e.target.files[0]);
              }
            }}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />

          {previousDoc.displayName ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {previousDoc.displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatFileSize(previousDoc.sizeBytes)} · Baseline agreement
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload Previous Version (Base Draft)"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handlePrevDrop}
              onClick={() => prevInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  prevInputRef.current?.click();
                }
              }}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-lg p-6 text-center cursor-pointer transition-colors space-y-2 bg-slate-50/50 dark:bg-slate-950/40"
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select or drop Previous Version (Base Draft)
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  PDF, DOCX, or TXT (up to 15 MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Swap button placed between cards on desktop */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button
            type="button"
            onClick={onSwapVersions}
            aria-label="Swap Previous and Current versions"
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 shadow-md transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            title="Swap Previous and Current versions"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* CURRENT VERSION Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                CURRENT VERSION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                Revised Redline
              </span>
            </div>
            {currentDoc.displayName && (
              <button
                type="button"
                onClick={onClearCurrent}
                aria-label="Remove current document"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
                title="Clear current document"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            type="file"
            ref={currInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onSelectCurrent(e.target.files[0]);
              }
            }}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />

          {currentDoc.displayName ? (
            <div className="rounded-lg border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 text-indigo-700 dark:text-indigo-300">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentDoc.displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatFileSize(currentDoc.sizeBytes)} · Revised version
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload Current Version (Revised Redline)"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleCurrDrop}
              onClick={() => currInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  currInputRef.current?.click();
                }
              }}
              className="border-2 border-dashed border-blue-200 dark:border-blue-900 hover:border-blue-500 dark:hover:border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-lg p-6 text-center cursor-pointer transition-colors space-y-2 bg-blue-50/20 dark:bg-blue-950/20"
            >
              <Upload className="w-6 h-6 text-blue-500 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select or drop Current Version (Revised Redline)
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  PDF, DOCX, or TXT (up to 15 MB)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Swap Button */}
      <div className="flex md:hidden justify-center">
        <button
          type="button"
          onClick={onSwapVersions}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px] cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span>Swap Previous & Current Versions</span>
        </button>
      </div>

      {/* Error Message if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Compare Action Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCompare}
          disabled={!isReadyToCompare || isComparing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
        >
          {isComparing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Legal Changes...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>Run Semantic Legal Comparison</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
