"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  FileCheck,
  File,
  ChevronDown,
} from "lucide-react";
import { addRecentDocument } from "@/lib/storage/recentDocumentsStore";

export type IntakeState = "idle" | "selected" | "uploading" | "validating" | "analyzing" | "complete" | "error";

interface StageStatus {
  id: string;
  name: string;
  detail: string;
  status: "pending" | "running" | "completed" | "failed";
}

const INITIAL_STAGES: StageStatus[] = [
  {
    id: "read",
    name: "Reading document",
    detail: "Securely reading document",
    status: "pending",
  },
  {
    id: "clauses",
    name: "Extracting clauses",
    detail: "Identifying clause boundaries and section numbering",
    status: "pending",
  },
  {
    id: "terms",
    name: "Identifying important terms",
    detail: "Detecting one-sided risks, obligations, and financial terms",
    status: "pending",
  },
  {
    id: "jurisdiction",
    name: "Checking legal context",
    detail: "Detecting jurisdiction and verified statutory authorities",
    status: "pending",
  },
  {
    id: "evidence",
    name: "Building evidence chains",
    detail: "Linking findings to verified legal context",
    status: "pending",
  },
  {
    id: "action",
    name: "Preparing action plan",
    detail: "Assembling preparation steps and lawyer-ready brief",
    status: "pending",
  },
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export default function ReviewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [intakeState, setIntakeState] = useState<IntakeState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [userRole, setUserRole] = useState("employee");
  const [reviewDepth, setReviewDepth] = useState("comprehensive");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stages, setStages] = useState<StageStatus[]>(INITIAL_STAGES);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const validateLocalFile = (file: File): { valid: boolean; error?: string } => {
    if (!file || file.size === 0) return { valid: false, error: "Uploaded file is empty (0 bytes)." };
    if (file.size > MAX_FILE_SIZE_BYTES) return { valid: false, error: "File exceeds the 15 MB limit." };
    const lower = file.name.toLowerCase();
    const ok = lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".txt");
    if (!ok) return { valid: false, error: "Unsupported type. LawPilot accepts PDF, DOCX, and TXT." };
    return { valid: true };
  };

  const handleFileSelection = (file: File) => {
    const v = validateLocalFile(file);
    if (!v.valid) {
      setSelectedFile(null);
      setErrorMessage(v.error || "The document could not be read.");
      setIntakeState("error");
      return;
    }
    setSelectedFile(file);
    setErrorMessage(null);
    setIntakeState("selected");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelection(e.dataTransfer.files[0]);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null); setErrorMessage(null); setIntakeState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileTypeLabel = (n: string): string => {
    const l = n.toLowerCase();
    if (l.endsWith(".pdf")) return "PDF Document";
    if (l.endsWith(".docx")) return "Microsoft Word (.docx)";
    if (l.endsWith(".txt")) return "Plain Text (.txt)";
    return "Legal Document";
  };

  const updateStage = (index: number, status: "pending" | "running" | "completed" | "failed") => {
    setStages((prev) => prev.map((s, idx) => (idx === index ? { ...s, status } : s)));
  };

  const runAnalysis = async () => {
    if (!selectedFile) { setErrorMessage("Please select a document."); setIntakeState("error"); return; }

    setErrorMessage(null);
    setIntakeState("uploading");
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "pending" })));

    try {
      updateStage(0, "running");
      setIntakeState("validating");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("role", userRole);
      formData.append("depth", reviewDepth);

      setTimeout(() => { updateStage(0, "completed"); updateStage(1, "running"); setIntakeState("analyzing"); }, 400);
      setTimeout(() => { updateStage(1, "completed"); updateStage(2, "running"); }, 800);
      setTimeout(() => { updateStage(2, "completed"); updateStage(3, "running"); }, 1200);

      const response = await fetch("/api/review/analyze", { method: "POST", body: formData });
      let result: { success?: boolean; error?: string; report?: unknown; reportId?: string } = {};
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `The document analysis service returned an unreadable response (HTTP ${response.status}). Please try again.`
        );
      }

      if (!response.ok || !result.success) throw new Error(result.error || "The document could not be read.");

      updateStage(3, "completed");
      updateStage(4, "running");
      updateStage(4, "completed");
      updateStage(5, "running");
      updateStage(5, "completed");
      setIntakeState("complete");

      if (typeof window !== "undefined" && result.report && result.reportId) {
        try { localStorage.setItem(`lawpilot_report_${result.reportId}`, JSON.stringify(result.report)); } catch { /* quota */ }
        addRecentDocument({
          id: result.reportId,
          title: selectedFile.name.replace(/\.(pdf|docx|txt)$/i, ""),
          fileName: selectedFile.name,
          fileSizeBytes: selectedFile.size,
          fileType: selectedFile.type as "application/pdf" | "text/plain" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          uploadedAt: new Date().toISOString(),
          analysisId: result.reportId,
          status: "analyzed",
        });
      }

      setTimeout(() => { router.push(`/analysis/${result.reportId}`); }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setIntakeState("error");
      setStages((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s)));
    }
  };

  const isBusy = ["uploading", "validating", "analyzing", "complete"].includes(intakeState);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analyze a legal document
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Upload a PDF, DOCX, or TXT. LawPilot extracts clauses, detects jurisdiction,
          builds evidence chains, and prepares an actionable brief.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Want to see an example first?{" "}
          <Link
            href="/analysis/demo-employment-agreement"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            View the sample employment agreement analysis
          </Link>
          .
        </p>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30 flex items-start justify-between gap-3 text-xs lp-animate-slide-down">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 dark:text-red-200">Intake Notice</p>
              <p className="mt-0.5 text-red-700 dark:text-red-300">{errorMessage}</p>
            </div>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="p-1 text-red-400 hover:text-red-600 cursor-pointer" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main area */}
      {isBusy ? (
        /* Processing view */
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Analyzing document</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono truncate max-w-[280px]">{selectedFile?.name}</p>
            </div>
            <span className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>

          <div className="space-y-2">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  stage.status === "running"
                    ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20"
                    : stage.status === "completed"
                    ? "border-transparent bg-transparent"
                    : "border-transparent opacity-40"
                } lp-animate-fade-in lp-delay-${Math.min(idx + 1, 6)}`}
              >
                <div className="mt-0.5 shrink-0">
                  {stage.status === "completed" ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : stage.status === "running" ? (
                    <div className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                      <span className="h-2.5 w-2.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                  ) : stage.status === "failed" ? (
                    <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  <span className={`font-semibold block ${
                    stage.status === "running" ? "text-indigo-700 dark:text-indigo-300"
                    : stage.status === "completed" ? "text-slate-700 dark:text-slate-200"
                    : "text-slate-400"
                  }`}>
                    {stage.name}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{stage.detail}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-1">
            Ephemeral session processing · No database persistence
          </p>
        </div>
      ) : selectedFile ? (
        /* Selected file card */
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-xs lp-animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
                {selectedFile.name.toLowerCase().endsWith(".pdf") ? (
                  <FileText className="w-5 h-5" />
                ) : selectedFile.name.toLowerCase().endsWith(".docx") ? (
                  <FileCode className="w-5 h-5" />
                ) : (
                  <File className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white break-all leading-snug">
                  {selectedFile.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{getFileTypeLabel(selectedFile.name)}</span>
                  <span>·</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <FileCheck className="w-3.5 h-3.5" />
                    Valid
                  </span>
                </div>
              </div>
            </div>
            <button type="button" onClick={removeSelectedFile} className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer" title="Remove file">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer">
              Replace document
            </button>
            <span className="text-slate-400">Ready to analyze</span>
          </div>
        </div>
      ) : (
        /* Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-10 md:p-14 text-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? "border-indigo-400 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/30 scale-[1.01]"
              : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            aria-label="Upload legal document (PDF, DOCX, or TXT)"
            accept=".pdf,.docx,.txt"
            onChange={handleFileInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center pointer-events-none">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-5 transition-colors duration-200 ${
              isDragging ? "bg-indigo-100 dark:bg-indigo-900/60" : "bg-slate-100 dark:bg-slate-800"
            }`}>
              <UploadCloud className={`w-7 h-7 transition-colors duration-200 ${isDragging ? "text-indigo-600" : "text-slate-400 dark:text-slate-500"}`} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {isDragging ? "Drop to upload" : "Drag & drop your document"}
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              or <span className="text-indigo-600 dark:text-indigo-400 font-semibold">browse files</span>
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {["PDF (.pdf)", "Word (.docx)", "Text (.txt)", "Max 15 MB"].map((label) => (
                <span key={label} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced options (collapsed by default) */}
      {!isBusy && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <span>Advanced Intake Configuration</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </button>
          {advancedOpen && (
            <div className="p-4 bg-white dark:bg-slate-900 space-y-4 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label htmlFor="user-role" className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  Your Perspective / Role
                </label>
                <select
                  id="user-role"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="employee">Employee / Candidate (Review obligations & exit friction)</option>
                  <option value="consultant">Independent Consultant / Contractor (IP & payment risk)</option>
                  <option value="neutral">Neutral Auditor (Objective symmetry analysis)</option>
                </select>
                <p className="text-[11px] text-slate-400">LawPilot highlights terms unfavorable to this role.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="review-depth" className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  Analysis Focus
                </label>
                <select
                  id="review-depth"
                  value={reviewDepth}
                  onChange={(e) => setReviewDepth(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="comprehensive">Comprehensive (All Clauses + Evidence)</option>
                  <option value="financial_obligations">Financial Terms & Early Departure</option>
                  <option value="restrictive_covenants">Non-Compete & IP Focus</option>
                </select>
                <p className="text-[11px] text-slate-400">Directs extraction depth and clause weights.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety + CTA */}
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">Privacy & Security:</strong>{" "}
            Documents are processed for the requested analysis and are not persisted by LawPilot in a third-party application database. External AI-provider handling is governed by the provider&apos;s applicable API terms and configuration.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {selectedFile && !isBusy && (
            <button
              type="button"
              onClick={removeSelectedFile}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={runAnalysis}
            disabled={isBusy || !selectedFile}
            className="w-full sm:w-auto ml-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isBusy ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <span>Analyze Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
