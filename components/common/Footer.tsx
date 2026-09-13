import React from "react";
import Link from "next/link";
import { Scale, ShieldCheck } from "lucide-react";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Safety Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                LawPilot
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-300">· Understand. Verify. Act.</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
              A GenAI-powered legal information and document assistance platform. Designed for transparent legal reasoning through the Evidence Chain, grounded citations, and pragmatic action planning.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Built on 10 Core Legal Safety & Integrity Principles</span>
            </div>
          </div>

          {/* Col 2: Product Pathways */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Navigation
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li>
                <Link href="/workspace" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Workspace
                </Link>
              </li>
              <li>
                <Link href="/review" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Document Review
                </Link>
              </li>
              <li>
                <Link href="/situation" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Situation Navigator
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Document Compare
                </Link>
              </li>
              <li>
                <Link href="/analysis/demo-commercial-lease" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Sample Analysis Report
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Safety */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Safety & Governance
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li>
                <Link href="/settings" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Privacy & Data Retention
                </Link>
              </li>
              <li>
                <span className="text-slate-700 dark:text-slate-300">Untrusted Document Isolation</span>
              </li>
              <li>
                <span className="text-slate-700 dark:text-slate-300">Zero Citation Fabrication</span>
              </li>
              <li>
                <span className="text-slate-700 dark:text-slate-300">Transparent Uncertainty</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Mandatory Legal Disclaimer */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-600 dark:text-slate-300 text-center sm:text-left">
            <strong>Mandatory Notice:</strong> {GLOBAL_LEGAL_DISCLAIMER}
          </p>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 shrink-0">
            © {new Date().getFullYear()} LawPilot. GenAI Competition Edition.
          </p>
        </div>
      </div>
    </footer>
  );
}
