"use client";

import React, { useState } from "react";
import { GLOBAL_LEGAL_DISCLAIMER, DETAILED_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";

export function GlobalDisclaimer() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <aside
      aria-label="Legal safety disclaimer"
      className="bg-slate-900 text-slate-300 border-b border-slate-800 text-xs py-2 px-4 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-medium text-slate-200">
            {GLOBAL_LEGAL_DISCLAIMER}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span>{showDetails ? "Hide full notice" : "Full legal disclosure"}</span>
          {showDetails ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>
      {showDetails && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          {DETAILED_LEGAL_DISCLAIMER}
        </div>
      )}
    </aside>
  );
}
