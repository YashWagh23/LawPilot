import React from "react";
import Link from "next/link";
import { Scale, ShieldCheck } from "lucide-react";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand & mission */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-indigo-600 shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                LawPilot
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              GenAI-powered legal document intelligence. Transparent reasoning through Evidence Chains, grounded citations, and pragmatic action planning.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Built on 10 Core Legal Safety Principles</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Pathways
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/review",     label: "Document Review" },
                { href: "/compare",    label: "Compare Redlines" },
                { href: "/situation",  label: "Situation Navigator" },
                { href: "/analysis/demo-employment-agreement", label: "Sample Agreement" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Safety & Governance
            </h4>
            <ul className="space-y-2.5">
              {[
                "Private Document Processing",
                "Verified Legal Citations",
                "Clear Uncertainty Boundaries",
                "Secure Document Sandboxing",
              ].map((label) => (
                <li key={label} className="text-xs text-slate-500 dark:text-slate-400">
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-2xl">
            <strong className="font-semibold text-slate-500 dark:text-slate-400">Notice:</strong>{" "}
            {GLOBAL_LEGAL_DISCLAIMER}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
            © {new Date().getFullYear()} LawPilot
          </p>
        </div>
      </div>
    </footer>
  );
}
