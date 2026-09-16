import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/60 min-h-[100dvh] flex items-center">
        {/* Subtle gradient backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-[#0C0E14] dark:via-[#0C0E14] dark:to-[#0C0E14]"
        />

        {/* ColorBends — reduced opacity, no purple tint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.18] dark:opacity-[0.40] transition-opacity duration-700"
        >
          <ColorBends
            colors={["#6366F1", "#0EA5E9", "#10B981"]}
            rotation={90}
            speed={0.15}
            scale={1}
            frequency={1}
            warpStrength={0.8}
            mouseInfluence={0.6}
            noise={0.12}
            parallax={0.3}
            iterations={1}
            intensity={1.2}
            bandWidth={6}
            transparent
            autoRotate={0}
            color="#6366F1"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-20 md:pb-24">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] lp-text-balance lp-animate-fade-up">
            Legal documents weren&apos;t{" "}
            written for humans.
            <br />
            <span className="text-indigo-600 dark:text-indigo-400">LawPilot was.</span>
          </h1>

          {/* Sub-copy */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed lp-text-pretty lp-animate-fade-up lp-delay-1">
            Deconstruct complex legal agreements into plain English, verify statutory
            context against official authorities, and determine practical next steps —
            without a law degree.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-start gap-3 lp-animate-fade-up lp-delay-2">
            <Link
              href="/review"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors duration-150 hover:shadow-sm"
            >
              Analyze a document
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/analysis/demo-employment-agreement"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
            >
              See a sample analysis
            </Link>
          </div>

          {/* Trust signals — below CTAs, inline, minimal */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 dark:text-slate-500 lp-animate-fade-up lp-delay-3">
            <span>No account required</span>
            <span aria-hidden="true">·</span>
            <span>Document isolation</span>
            <span aria-hidden="true">·</span>
            <span>Grounded citations</span>
            <span aria-hidden="true">·</span>
            <span>Auditable evidence chains</span>
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
