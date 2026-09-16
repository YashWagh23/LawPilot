import React from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800/60 dark:bg-[#0C0E14]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                <Scale className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                LawPilot
              </span>
            </Link>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs lp-text-pretty">
              Legal document intelligence. Evidence chains, grounded citations, and practical action planning.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
              Tools
            </p>
            <ul className="space-y-2">
              {[
                { href: "/review",     label: "Document review" },
                { href: "/compare",    label: "Compare documents" },
                { href: "/situation",  label: "Situation navigator" },
                { href: "/analysis/demo-employment-agreement", label: "Sample Agreement" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-2xl lp-text-pretty">
            <strong className="font-medium text-slate-500 dark:text-slate-400">Notice:</strong>{" "}
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
