import React from "react";
import {
  Shield,
  Cpu,
  Database,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { LEGAL_SAFETY_RULES } from "@/lib/safety/safetyRules";
import { DETAILED_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export default function SettingsPage() {
  const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            System & Governance
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300">·</span>
          <span className="text-xs text-slate-700 dark:text-slate-300">Settings & Compliance</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          LawPilot Safety, Privacy & AI Architecture
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          LawPilot is engineered under a strict legal safety foundation to deliver grounded assistance while preventing unauthorized practice of law and citation hallucinations.
        </p>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Gemini AI Integration */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Gemini GenAI Engine
              </h2>
            </div>
            {isGeminiConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                API Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" />
                Demo Sandbox Active
              </span>
            )}
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p>
              <strong>Default Reasoning:</strong> Gemini 2.5 Flash / Pro
            </p>
            <p>
              <strong>Prompt Security:</strong> Server-side execution only. Zero client-side API key exposure.
            </p>
            <p>
              <strong>Structured Enforcement:</strong> Strict JSON Schemas via Zod.
            </p>
          </div>
        </div>

        {/* Firebase Cloud Infrastructure */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Firebase Firestore & Storage
              </h2>
            </div>
            {isFirebaseConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                Firebase Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                <FileCheck className="w-3 h-3" />
                Local Demo Mode
              </span>
            )}
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p>
              <strong>Document Storage:</strong> Encrypted document bucket storage.
            </p>
            <p>
              <strong>Data Isolation:</strong> User agreements isolated per tenant.
            </p>
            <p>
              <strong>Model Training:</strong> Customer contracts are never utilized to train public foundation models.
            </p>
          </div>
        </div>
      </div>

      {/* 10 Core Legal Safety Principles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              The 10 Foundational Legal Safety Principles
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              LawPilot operates under rigid programmatic constraints to preserve legal integrity.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <Shield className="w-4 h-4" />
            <span>Enforced Across All Agents</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEGAL_SAFETY_RULES.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  Rule {rule.ruleNumber}: {rule.name}
                </span>
                <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {rule.id}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{rule.description}</p>
              <div className="pt-1 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                Requirement: {rule.strictRequirement}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Legal Disclaimer Box */}
      <div className="rounded-xl border border-slate-200 bg-slate-100/60 p-6 dark:border-slate-800 dark:bg-slate-900/40 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
          <Scale className="w-4 h-4 text-blue-600" />
          <span>Full Regulatory & Licensing Disclaimer</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {DETAILED_LEGAL_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
