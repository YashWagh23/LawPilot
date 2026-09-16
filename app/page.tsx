import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ColorBends from "@/components/effects/ColorBendsLoader";
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
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-slate-50 via-white to-white dark:from-[#0C0E14] dark:via-[#0C0E14] dark:to-[#0C0E14]"
        />

        {/* Dot-grid texture — 1px dots, 32px pitch, subconscious */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 lp-hero-grid"
        />

        {/* ColorBends — institutional palette, kept strictly behind headline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.30] dark:opacity-[0.45] transition-opacity duration-700"
        >
          <ColorBends
            colors={["#6366F1", "#475569", "#334155"]}
            rotation={110}
            speed={0.08}
            scale={1.1}
            frequency={0.9}
            warpStrength={0.7}
            mouseInfluence={0.4}
            noise={0.08}
            parallax={0.25}
            iterations={1}
            intensity={1.0}
            bandWidth={5}
            transparent
            autoRotate={0}
            color="#6366F1"
          />
        </div>

        {/* Text contrast protection wash — guarantees maximum readability over moving shader */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_65%_55%_at_50%_40%,rgba(255,255,255,0.42)_0%,transparent_75%)] dark:bg-[radial-gradient(ellipse_65%_55%_at_50%_40%,rgba(12,14,20,0.48)_0%,transparent_75%)]"
        />

        {/* Edge vignette — soft perimeter depth, dark-mode calibrated */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_80%_65%_at_50%_35%,transparent_40%,rgba(15,23,42,0.035)_100%)] dark:bg-[radial-gradient(ellipse_80%_65%_at_50%_35%,transparent_35%,rgba(0,0,0,0.50)_100%)]"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-20 md:pb-24">
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
