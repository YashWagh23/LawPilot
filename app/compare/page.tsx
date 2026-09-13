"use client";

import React, { useState } from "react";
import { CheckCircle2, Layers } from "lucide-react";
import type {
  ClauseComparisonItem,
  DocumentComparisonResult,
} from "@/types";
import {
  FLAGSHIP_DEMO_COMPARISON,
} from "@/lib/demo/compareDemoData";
import { CompareHeader } from "@/components/compare/CompareHeader";
import { DualDocumentUploader } from "@/components/compare/DualDocumentUploader";
import { ComparisonSummaryView } from "@/components/compare/ComparisonSummaryView";
import { ChangeCardList } from "@/components/compare/ChangeCardList";
import { SideBySideClauseView } from "@/components/compare/SideBySideClauseView";
import { CompareAskModal } from "@/components/compare/CompareAskModal";

interface DocState {
  file: File | null;
  displayName: string;
  sizeBytes?: number;
  isDemo?: boolean;
}

export default function ComparePage() {
  const [previousDoc, setPreviousDoc] = useState<DocState>({
    file: null,
    displayName: "",
    sizeBytes: undefined,
    isDemo: false,
  });

  const [currentDoc, setCurrentDoc] = useState<DocState>({
    file: null,
    displayName: "",
    sizeBytes: undefined,
    isDemo: false,
  });

  const [comparisonResult, setComparisonResult] = useState<DocumentComparisonResult | null>(null);
  const [selectedChange, setSelectedChange] = useState<ClauseComparisonItem | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ask LawPilot Modal State
  const [askModalState, setAskModalState] = useState<{
    isOpen: boolean;
    question: string;
    clauseTitle: string;
  }>({
    isOpen: false,
    question: "",
    clauseTitle: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Flagship India Demo pair
  const handleLoadDemo = React.useCallback(() => {
    setErrorMessage(null);
    setPreviousDoc({
      file: null,
      displayName: FLAGSHIP_DEMO_COMPARISON.previousDocument.fileName,
      sizeBytes: FLAGSHIP_DEMO_COMPARISON.previousDocument.fileSizeBytes,
      isDemo: true,
    });
    setCurrentDoc({
      file: null,
      displayName: FLAGSHIP_DEMO_COMPARISON.currentDocument.fileName,
      sizeBytes: FLAGSHIP_DEMO_COMPARISON.currentDocument.fileSizeBytes,
      isDemo: true,
    });
    setComparisonResult(FLAGSHIP_DEMO_COMPARISON);
    // Select first material change
    if (FLAGSHIP_DEMO_COMPARISON.topMaterialChanges.length > 0) {
      setSelectedChange(FLAGSHIP_DEMO_COMPARISON.topMaterialChanges[0]);
    } else if (FLAGSHIP_DEMO_COMPARISON.changes.length > 0) {
      setSelectedChange(FLAGSHIP_DEMO_COMPARISON.changes[0]);
    }
    showToast("Loaded sample redline comparison: Candidate Baseline vs HR Redline.");
  }, []);

  // Support direct ?demo=true or ?demo=1 link loading
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "true" || params.get("demo") === "1") {
        const timer = setTimeout(() => {
          handleLoadDemo();
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [handleLoadDemo]);

  // Swap PREVIOUS <-> CURRENT versions
  const handleSwapVersions = () => {
    const tempPrev = { ...previousDoc };
    const tempCurr = { ...currentDoc };

    setPreviousDoc(tempCurr);
    setCurrentDoc(tempPrev);
    setComparisonResult(null);
    setSelectedChange(null);
    setErrorMessage(null);
    showToast("Swapped Previous and Current document versions.");
  };

  // Run Semantic Comparison
  const handleCompare = async () => {
    setErrorMessage(null);

    // Case 1: Demo files selected
    if (previousDoc.isDemo && currentDoc.isDemo) {
      setComparisonResult(FLAGSHIP_DEMO_COMPARISON);
      if (FLAGSHIP_DEMO_COMPARISON.topMaterialChanges.length > 0) {
        setSelectedChange(FLAGSHIP_DEMO_COMPARISON.topMaterialChanges[0]);
      }
      return;
    }

    // Case 2: Custom uploaded files
    if (!previousDoc.file || !currentDoc.file) {
      setErrorMessage("Please upload both Previous Version and Current Version document files.");
      return;
    }

    if (previousDoc.file.name === currentDoc.file.name && previousDoc.file.size === currentDoc.file.size) {
      setErrorMessage(
        "Identical document selected for both Previous and Current versions. Please select two distinct drafts to compare."
      );
      return;
    }

    setIsComparing(true);

    try {
      const formData = new FormData();
      formData.append("previousFile", previousDoc.file);
      formData.append("currentFile", currentDoc.file);

      const res = await fetch("/api/compare", {
        method: "POST",
        body: formData,
      });

      let data: { success?: boolean; comparison?: typeof comparisonResult; error?: string } = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        setErrorMessage(
          `The comparison service returned an unreadable response (HTTP ${res.status}). Please try again.`
        );
        return;
      }

      if (data.success && data.comparison) {
        setComparisonResult(data.comparison);
        if (data.comparison.topMaterialChanges.length > 0) {
          setSelectedChange(data.comparison.topMaterialChanges[0]);
        } else if (data.comparison.changes.length > 0) {
          setSelectedChange(data.comparison.changes[0]);
        }
        showToast("Semantic legal comparison complete!");
      } else {
        setErrorMessage(data.error || "Failed to compare document versions.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to comparison service.";
      setErrorMessage(msg);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <CompareHeader onLoadDemo={handleLoadDemo} />

      {/* Dual Document Uploader Cards */}
      <DualDocumentUploader
        previousDoc={previousDoc}
        currentDoc={currentDoc}
        onSelectPrevious={(file) => {
          setPreviousDoc({
            file,
            displayName: file.name,
            sizeBytes: file.size,
            isDemo: false,
          });
          setComparisonResult(null);
          setErrorMessage(null);
        }}
        onSelectCurrent={(file) => {
          setCurrentDoc({
            file,
            displayName: file.name,
            sizeBytes: file.size,
            isDemo: false,
          });
          setComparisonResult(null);
          setErrorMessage(null);
        }}
        onClearPrevious={() => {
          setPreviousDoc({ file: null, displayName: "", isDemo: false });
          setComparisonResult(null);
        }}
        onClearCurrent={() => {
          setCurrentDoc({ file: null, displayName: "", isDemo: false });
          setComparisonResult(null);
        }}
        onSwapVersions={handleSwapVersions}
        onCompare={handleCompare}
        isComparing={isComparing}
        errorMessage={errorMessage}
      />

      {/* COMPARISON RESULTS WORKSPACE */}
      {comparisonResult && (
        <div className="space-y-8 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
          {/* Summary & Metrics */}
          <ComparisonSummaryView
            summary={comparisonResult.summary}
            jurisdictionComparison={comparisonResult.jurisdictionComparison}
            topMaterialChanges={comparisonResult.topMaterialChanges}
            onSelectChange={(change) => {
              setSelectedChange(change);
              // Scroll down to detail view if on small screen
              const detailEl = document.getElementById("clause-inspection-area");
              if (detailEl && window.innerWidth < 1024) {
                detailEl.scrollIntoView({ behavior: "smooth" });
              }
            }}
            selectedChangeId={selectedChange?.id}
          />

          {/* Two-Column Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Filterable Change List (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  All Changes ({comparisonResult.summary.clausesChanged + comparisonResult.summary.clausesAdded + comparisonResult.summary.clausesRemoved})
                </h3>
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  {comparisonResult.topMaterialChanges.length} Material Changes
                </span>
              </div>

              <ChangeCardList
                changes={comparisonResult.changes}
                selectedChange={selectedChange}
                onSelectChange={(change) => setSelectedChange(change)}
              />
            </div>

            {/* Right Column: Side-by-Side Detail View & Why It Matters (7 cols) */}
            <div id="clause-inspection-area" className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Clause Difference & Legal Assessment
                </h3>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                  Grounded Evidence
                </span>
              </div>

              {selectedChange ? (
                <SideBySideClauseView
                  change={selectedChange}
                  onAskLawPilot={(q) => {
                    setAskModalState({
                      isOpen: true,
                      question: q,
                      clauseTitle: selectedChange.clauseTitle,
                    });
                  }}
                  onActionAdded={(title) => {
                    showToast(`Added to Action Plan: "${title}"`);
                  }}
                />
              ) : (
                <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select a clause from the list to inspect differences
                  </p>
                  <p className="text-[11px] text-slate-500">
                    View side-by-side text, parameter changes, and statutory legal context.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-Context Ask LawPilot Modal */}
      <CompareAskModal
        isOpen={askModalState.isOpen}
        onClose={() => setAskModalState({ isOpen: false, question: "", clauseTitle: "" })}
        initialQuestion={askModalState.question}
        clauseTitle={askModalState.clauseTitle}
      />
    </div>
  );
}
