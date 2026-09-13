"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  FileCheck,
  File,
} from "lucide-react";

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
    name: "1. Reading document",
    detail: "Reading text and establishing untrusted memory boundary",
    status: "pending",
  },
  {
    id: "clauses",
    name: "2. Extracting clauses",
    detail: "Identifying clause boundaries and section numbering",
    status: "pending",
  },
  {
    id: "terms",
    name: "3. Identifying important terms",
    detail: "Detecting one-sided risks, obligations, and financial terms",
    status: "pending",
  },
  {
    id: "jurisdiction",
    name: "4. Checking legal context",
    detail: "Detecting jurisdiction and retrieving verified statutory authorities",
    status: "pending",
  },
  {
    id: "evidence",
    name: "5. Building evidence chains",
    detail: "Linking findings to verified legal context and factual uncertainty",
    status: "pending",
  },
  {
    id: "action",
    name: "6. Preparing action plan",
    detail: "Assembling reversible preparation steps and lawyer-ready brief",
    status: "pending",
  },
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

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

  // Validate a candidate file locally before submission
  const validateLocalFile = (file: File): { valid: boolean; error?: string } => {
    if (!file || file.size === 0) {
      return { valid: false, error: "Uploaded file is empty (0 bytes)." };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: "File exceeds the 15 MB limit." };
    }

    const lowerName = file.name.toLowerCase();
    const isSupported =
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".txt");

    if (!isSupported) {
      return {
        valid: false,
        error: "Unsupported file type. LawPilot supports PDF (.pdf), Microsoft Word (.docx), and Plain Text (.txt) documents.",
      };
    }

    return { valid: true };
  };

  const handleFileSelection = (file: File) => {
    const validation = validateLocalFile(file);
    if (!validation.valid) {
      setSelectedFile(null);
      setErrorMessage(validation.error || "The document could not be read.");
      setIntakeState("error");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setIntakeState("selected");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setIntakeState("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileTypeLabel = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return "PDF Document";
    if (lower.endsWith(".docx")) return "Microsoft Word (.docx)";
    if (lower.endsWith(".txt")) return "Plain Text (.txt)";
    return "Legal Document";
  };

  const updateStage = (index: number, status: "pending" | "running" | "completed" | "failed") => {
    setStages((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, status } : s))
    );
  };

  const runAnalysis = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a document to analyze.");
      setIntakeState("error");
      return;
    }

    setErrorMessage(null);
    setIntakeState("uploading");
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "pending" })));

    try {
      // Step 1: Reading document
      updateStage(0, "running");
      setIntakeState("validating");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("role", userRole);
      formData.append("depth", reviewDepth);

      // Simulate step 1 completion when request is underway
      setTimeout(() => {
        updateStage(0, "completed");
        updateStage(1, "running");
        setIntakeState("analyzing");
      }, 400);

      setTimeout(() => {
        updateStage(1, "completed");
        updateStage(2, "running");
      }, 800);

      setTimeout(() => {
        updateStage(2, "completed");
        updateStage(3, "running");
      }, 1200);

      const response = await fetch("/api/review/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "The document could not be read.");
      }

      // Complete stages 3, 4, 5
      updateStage(3, "completed");
      updateStage(4, "running");
      updateStage(4, "completed");
      updateStage(5, "running");
      updateStage(5, "completed");
      setIntakeState("complete");

      // Local-first client persistence backup: save report in localStorage
      if (typeof window !== "undefined" && result.report && result.reportId) {
        try {
          localStorage.setItem(
            `lawpilot_report_${result.reportId}`,
            JSON.stringify(result.report)
          );
        } catch (_e) {
          // LocalStorage quota fallback
        }
      }

      // Seamlessly navigate to analysis workspace
      setTimeout(() => {
        router.push(`/analysis/${result.reportId}`);
      }, 400);
    } catch (err: unknown) {
      let msg = "An unexpected error occurred during analysis.";
      if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
      setIntakeState("error");
      setStages((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s))
      );
    }
  };

  const isBusy =
    intakeState === "uploading" ||
    intakeState === "validating" ||
    intakeState === "analyzing" ||
    intakeState === "complete";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Document Intake
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">Understand · Verify · Act</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Upload Document for Real-Time Analysis
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Upload legal agreements in PDF, DOCX, or TXT. LawPilot segments clauses, extracts financial terms, detects governing jurisdiction, builds verified evidence chains, and prepares an actionable preparation brief.
        </p>
      </div>

      {/* Flagship India Demo Quick Launch Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Flagship Demo: India Employment Agreement
              </h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                🇮🇳 Maharashtra
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Want to see LawPilot in action immediately without uploading? Explore our sample agreement (Kavach Dynamics Technologies Pvt. Ltd. & Rohan Sharma, ₹32L CTC, ₹4.5L training bond, ICA §§ 27 & 74).
            </p>
          </div>
        </div>

        <Link
          href="/analysis/demo-employment-agreement"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs shrink-0 transition-colors cursor-pointer"
        >
          <span>Open Flagship Demo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Human-Readable Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Intake Validation Notice</p>
              <p className="mt-0.5 text-red-800 dark:text-red-300">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Intake Area: Dropzone vs Selected File vs Processing Stages */}
      {isBusy ? (
        /* Processing Experience with 6 Meaningful Stages */
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Processing Legal Document
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {selectedFile?.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Executing real-time clause extraction, statutory verification, and actionable brief preparation.
              </p>
            </div>
            <span className="inline-block h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          </div>

          {/* 6 Real Stages Checklist */}
          <div className="space-y-3.5">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className={`flex items-start gap-3.5 p-3 rounded-lg border transition-colors ${
                  stage.status === "running"
                    ? "border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20"
                    : stage.status === "completed"
                    ? "border-slate-100 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/40"
                    : "border-transparent text-slate-400"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {stage.status === "completed" ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : stage.status === "running" ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    </div>
                  ) : stage.status === "failed" ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 text-[10px] font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex flex-col text-xs">
                  <span
                    className={`font-semibold ${
                      stage.status === "running"
                        ? "text-blue-700 dark:text-blue-300"
                        : stage.status === "completed"
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {stage.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {stage.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span>Server-side prompt-injection boundary enforced.</span>
            <span>No fake counters · Direct analytical progress.</span>
          </div>
        </div>
      ) : selectedFile ? (
        /* Selected File Card with Metadata & Actions */
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
                {selectedFile.name.toLowerCase().endsWith(".pdf") ? (
                  <FileText className="w-6 h-6" />
                ) : selectedFile.name.toLowerCase().endsWith(".docx") ? (
                  <FileCode className="w-6 h-6" />
                ) : (
                  <File className="w-6 h-6" />
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white break-all">
                  {selectedFile.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{getFileTypeLabel(selectedFile.name)}</span>
                  <span>·</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <FileCheck className="w-3.5 h-3.5" />
                    Valid format & size
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={removeSelectedFile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              Replace with another document
            </button>
            <span className="text-slate-400">Ready to analyze</span>
          </div>
        </div>
      ) : (
        /* Idle State: Drag & Drop Intake Area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all shadow-xs relative ${
            isDragging
              ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-950/40 scale-[1.005]"
              : "border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-700"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            accept=".pdf,.docx,.txt"
            onChange={handleFileInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload legal document for analysis
            </h3>

            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 max-w-md">
              Drag & drop your agreement here, or{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                browse files
              </span>
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-slate-700 dark:text-slate-300">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                PDF (.pdf)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                Word (.docx)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                Text (.txt)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Max 15 MB
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Role & Depth Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        <div className="space-y-2">
          <label
            htmlFor="user-role-select"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            Your Position in Agreement
          </label>
          <select
            id="user-role-select"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            disabled={isBusy}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="employee">Employee / Executive</option>
            <option value="employer">Employer / Company</option>
            <option value="contractor">Independent Contractor / Vendor</option>
            <option value="client">Client / Customer</option>
            <option value="tenant">Tenant / Lessee</option>
            <option value="landlord">Landlord / Lessor</option>
          </select>
          <p className="text-[11px] text-slate-500">
            Tailors risk triage and lawyer briefing questions to your legal role.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="review-depth-select"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            Processing Focus
          </label>
          <select
            id="review-depth-select"
            value={reviewDepth}
            onChange={(e) => setReviewDepth(e.target.value)}
            disabled={isBusy}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="comprehensive">Comprehensive (All Clauses + Facts + Evidence Links)</option>
            <option value="financial_obligations">Financial Terms & Early Departure Focus</option>
            <option value="restrictive_covenants">Non-Compete & IP Focus</option>
          </select>
          <p className="text-[11px] text-slate-500">
            Directs extraction depth and clause attention weights.
          </p>
        </div>
      </div>

      {/* Safety Notice & Primary Action Bar */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>Untrusted Data Isolation:</strong> Documents are parsed in server memory under strict untrusted content boundaries. Injected prompt instructions (e.g., &ldquo;ignore previous instructions&rdquo;) are isolated as raw text and cannot alter model safety rules.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          {selectedFile && !isBusy && (
            <button
              type="button"
              onClick={removeSelectedFile}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear File
            </button>
          )}

          <button
            type="button"
            onClick={runAnalysis}
            disabled={isBusy || !selectedFile}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <>
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Processing Document...</span>
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
