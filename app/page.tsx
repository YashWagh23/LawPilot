import React from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import ColorBends from "@/components/effects/ColorBends";
import { UnderstandScene } from "@/components/landing/UnderstandScene";
import { VerifyScene } from "@/components/landing/VerifyScene";
import { ActScene } from "@/components/landing/ActScene";
import { CompareScene } from "@/components/landing/CompareScene";
import { FinalCtaScene } from "@/components/landing/FinalCtaScene";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ══════════════════════════════════════════════════════
          ========== HERO PROMPT ==========
          [MY HERO PROMPT WILL BE PROVIDED HERE]
          ========== END HERO PROMPT ==========
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/60">
        {/* Subtle gradient backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-950 dark:to-slate-950"
        />

        {/* ColorBends Interactive Shader Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-35 dark:opacity-60 transition-opacity duration-700"
        >
          <ColorBends
            colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
            rotation={90}
            speed={0.2}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={1}
            noise={0.15}
            parallax={0.5}
            iterations={1}
            intensity={1.5}
            bandWidth={6}
            transparent
            autoRotate={0}
            color="#A855F7"
          />
        </div>
        {/* Faint grid pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#4F46E5 1px, transparent 1px), linear-gradient(to right, #4F46E5 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white dark:bg-white/10 dark:text-white border border-slate-800 dark:border-white/20 shadow-xs mb-8 tracking-wide lp-animate-fade-up">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>LawPilot · Understand. Verify. Act.</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[3.6rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.1] lp-animate-fade-up lp-delay-1">
            Legal documents weren&apos;t{" "}
            <br className="hidden sm:block" />
            written for humans.
            <br />
            <span className="text-indigo-600 dark:text-indigo-400">LawPilot was.</span>
          </h1>

          {/* Sub-copy */}
          <p className="mt-7 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed lp-animate-fade-up lp-delay-2">
            Deconstruct complex legal agreements into plain English, verify statutory
            context against official authorities, and determine practical next steps —
            without a law degree.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 lp-animate-fade-up lp-delay-3">
            <Link
              href="/analysis/demo-employment-agreement"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Try the Demo</span>
              <span className="text-[11px] font-normal px-1.5 py-0.5 rounded-md bg-indigo-700/80 text-indigo-100">
                🇮🇳 India Flagship
              </span>
            </Link>

            <Link
              href="/review"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Analyze a Document</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400 lp-animate-fade-up lp-delay-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              No Login Required
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              Document Isolation
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Grounded Citations
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Zero Hallucinations
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CINEMATIC SLIDE-BASED PRODUCT STORY
          01 · Understand → 02 · Verify → 03 · Act → 04 · Compare
      ══════════════════════════════════════════════════════ */}
      <UnderstandScene />
      <VerifyScene />
      <ActScene />
      <CompareScene />

      {/* ══════════════════════════════════════════════════════
          05 · FINAL LAUNCHPAD CTA
      ══════════════════════════════════════════════════════ */}
      <FinalCtaScene />
    </div>
  );
}
