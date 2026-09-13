"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface PipelineStep {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
}

export default function ReviewPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userRole, setUserRole] = useState("employee");
  const [reviewDepth, setReviewDepth] = useState("comprehensive");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: "step-validate", label: "Validating document format & security signatures", status: "pending" },
    { id: "step-read", label: "Reading document & isolating pages", status: "pending" },
    { id: "step-clauses", label: "Identifying clauses & section boundaries", status: "pending" },
    { id: "step-terms", label: "Finding important terms & obligations", status: "pending" },
    { id: "step-report", label: "Preparing structured analysis report", status: "pending" },
  ]);

  const updateStepStatus = (index: number, status: "pending" | "running" | "completed" | "failed") => {
    setPipelineSteps((prev) =>
      prev.map((step, idx) => (idx === index ? { ...step, status } : step))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const runAnalysis = async (isDemo = false) => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Initialize progress indicators
    setPipelineSteps([
      { id: "step-validate", label: "Validating document format & security signatures", status: "running" },
      { id: "step-read", label: "Reading document & isolating pages", status: "pending" },
      { id: "step-clauses", label: "Identifying clauses & section boundaries", status: "pending" },
      { id: "step-terms", label: "Finding important terms & obligations", status: "pending" },
      { id: "step-report", label: "Preparing structured analysis report", status: "pending" },
    ]);

    try {
      // Step 1: Validation
      updateStepStatus(0, "running");

      let response: Response;

      if (isDemo) {
        // Fast transition for step 1 & 2
        updateStepStatus(0, "completed");
        updateStepStatus(1, "running");

        response = await fetch("/api/review/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDemo: true, role: userRole }),
        });
      } else {
        if (!selectedFile) {
          throw new Error("Please select a file to upload or choose the demo document.");
        }

        updateStepStatus(0, "completed");
        updateStepStatus(1, "running");

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("role", userRole);
        formData.append("depth", reviewDepth);

        response = await fetch("/api/review/analyze", {
          method: "POST",
          body: formData,
        });
      }

      updateStepStatus(1, "completed");
      updateStepStatus(2, "running");

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Document analysis failed.");
      }

      updateStepStatus(2, "completed");
      updateStepStatus(3, "running");
      updateStepStatus(3, "completed");
      updateStepStatus(4, "running");
      updateStepStatus(4, "completed");

      // Navigate to the analysis report
      setTimeout(() => {
        router.push(`/analysis/${result.reportId}`);
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during analysis.";
      setErrorMessage(msg);
      setIsProcessing(false);
      setPipelineSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s))
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Document Intelligence
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">Intake & Extraction</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Upload a Legal Agreement for Real-Time Analysis
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Upload PDF, DOCX, or TXT agreements. LawPilot validates the file, isolates clauses, extracts key facts, and maps every finding directly to source evidence.
        </p>
      </div>

      {/* Flagship Demo Quick-Action Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Flagship Demo: Executive Employment Agreement
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Run the full real-time extraction pipeline on our sample employment agreement (Aegis Cloud Dynamics vs. Alex Morgan, featuring $18,500 training reimbursement and 60-day notice).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => runAnalysis(true)}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs shrink-0 transition-colors cursor-pointer disabled:opacity-50"
        >
          <span>Run Demo Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Document Analysis Error</p>
              <p className="mt-0.5 text-red-800 dark:text-red-300">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Box or Pipeline Progress State */}
      {isProcessing ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Document Intelligence Pipeline Running
              </h3>
              <p className="text-xs text-slate-500">
                Executing real server-side validation, clause segmentation, and structured fact extraction.
              </p>
            </div>
            <span className="inline-block h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          </div>

          <div className="space-y-4">
            {pipelineSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-3 text-xs">
                {step.status === "completed" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : step.status === "running" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  </div>
                ) : step.status === "failed" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 text-[10px] font-mono">
                    {idx + 1}
                  </div>
                )}
                <span
                  className={`font-medium ${
                    step.status === "running"
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : step.status === "completed"
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-10 text-center dark:border-slate-800 dark:bg-slate-900/60 shadow-xs relative">
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{selectedFile.name}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready for processing
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Drop your contract here, or <span className="text-blue-600 hover:underline">browse files</span>
                </p>
                <p className="text-xs text-slate-500">
                  Supports PDF (.pdf), Microsoft Word (.docx), and Plain Text (.txt) up to 15MB
                </p>
              </div>
            )}
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
            disabled={isProcessing}
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
            Tailors clause attention findings to your legal role.
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
            disabled={isProcessing}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="comprehensive">Comprehensive (All Clauses + Facts + Evidence Links)</option>
            <option value="financial_obligations">Financial Terms & Early Departure Focus</option>
            <option value="restrictive_covenants">Non-Compete & IP Focus</option>
          </select>
          <p className="text-[11px] text-slate-500">
            Selects clause segmentation and extraction depth.
          </p>
        </div>
      </div>

      {/* Safety Notice & Action Bar */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>Untrusted Data Isolation:</strong> Documents are isolated in server memory. Text containing instructions like &ldquo;ignore previous instructions&rdquo; is treated solely as raw document content and never alters system rules.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          {selectedFile && (
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear File
            </button>
          )}

          <button
            type="button"
            onClick={() => runAnalysis(false)}
            disabled={isProcessing || !selectedFile}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Processing Document...</span>
              </>
            ) : (
              <>
                <span>Extract Document Facts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
