import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
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
        {/* Photographic backdrop — law office desk. Served via next/image (responsive srcset,
            AVIF/WebP) and preloaded as the LCP candidate. Never blurred; readability comes from
            the opacity + overlay layers below. Focal point biased right so the scales and gavel
            stay in frame on narrow viewports while the left side stays quiet behind the copy. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-slate-100 dark:bg-[#0C0E14]">
          <Image
            src="/hero-law-office.jpg"
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover object-[68%_center] opacity-90 dark:opacity-60"
          />
        </div>

        {/* Readability overlay — heavy behind the left-aligned copy, lighter toward the photo's
            subject on the right; near-uniform on mobile where copy spans the full width. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/85 via-white/80 to-white/90 md:bg-gradient-to-r md:from-white/[0.93] md:via-white/[0.84] md:via-55% md:to-white/40 dark:from-[#0C0E14]/85 dark:via-[#0C0E14]/80 dark:to-[#0C0E14]/90 md:dark:from-[#0C0E14]/[0.94] md:dark:via-[#0C0E14]/[0.86] md:dark:to-[#0C0E14]/50"
        />

        {/* Dot-grid texture — 1px dots, 32px pitch, subconscious */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 lp-hero-grid"
        />

        {/* ColorBends — institutional palette, kept strictly behind headline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.18] dark:opacity-[0.32] transition-opacity duration-700"
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

        {/* Bottom fade — hands the photo off cleanly to the next scene's flat background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-b from-transparent to-[#F8FAFC] dark:to-[#0C0E14]"
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-white dark:hover:bg-slate-800 transition-colors duration-150"
            >
              See a sample analysis
            </Link>
          </div>

          {/* Trust signals — below CTAs, inline, minimal */}
          <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-300 lp-animate-fade-up lp-delay-3">
            {["No account required", "Document isolation", "Grounded citations", "Auditable evidence chains"].map((signal) => (
              <li key={signal} className="inline-flex items-center gap-1.5">
                <Check aria-hidden="true" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {signal}
              </li>
            ))}
          </ul>
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
