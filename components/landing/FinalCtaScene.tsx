"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  GitCompare,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";

export function FinalCtaScene() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32 lg:pt-44 lg:pb-36 border-t border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-white via-[#FAF5FF]/30 to-[#F5F3FF]/50 dark:from-[#0C0E14] dark:via-[#0E111C] dark:to-[#080A10]">
      {/* ── Atmospheric Ambient Light Spots ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 w-[600px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-200/40 via-purple-200/25 to-transparent blur-3xl dark:from-indigo-900/20 dark:via-purple-900/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-[600px] h-[500px] rounded-full bg-gradient-to-tl from-blue-200/40 via-indigo-200/25 to-transparent blur-3xl dark:from-blue-900/20 dark:via-indigo-900/15"
      />

      {/* ── Flowing Curved Wave Forms (SVG Vector Ribbon System) ── */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full z-[1]"
        viewBox="0 0 1440 700"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Left sweeping wave gradient */}
          <linearGradient id="lp-wave-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#DDD6FE" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#E0E7FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          {/* Left stroke highlight */}
          <linearGradient id="lp-stroke-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#818CF8" stopOpacity="0.8" />
            <stop offset="65%" stopColor="#C084FC" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </linearGradient>

          {/* Left secondary under-ribbon */}
          <linearGradient id="lp-wave-left-sub" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.1" />
          </linearGradient>

          {/* Right sweeping wave gradient */}
          <linearGradient id="lp-wave-right" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#C7D2FE" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#E9D5FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          {/* Right stroke highlight */}
          <linearGradient id="lp-stroke-right" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#818CF8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </linearGradient>

          {/* Right secondary under-ribbon */}
          <linearGradient id="lp-wave-right-sub" x1="100%" y1="0%" x2="0%" y2="80%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.08" />
          </linearGradient>

          {/* Soft bottom crest overlay */}
          <linearGradient id="lp-wave-crest" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#EDE9FE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Layer 1: Left Background Upper Arch */}
        <path
          d="M 0,260 C 220,180 400,340 640,470 C 880,600 1160,540 1440,380 L 1440,700 L 0,700 Z"
          fill="url(#lp-wave-left)"
          className="dark:opacity-30"
        />
        <path
          d="M 0,260 C 220,180 400,340 640,470 C 880,600 1160,540 1440,380"
          fill="none"
          stroke="url(#lp-stroke-left)"
          strokeWidth="1.8"
          className="dark:opacity-40"
        />

        {/* Layer 2: Right Main Ribbon */}
        <path
          d="M 1440,240 C 1240,170 1020,330 780,480 C 540,630 240,580 0,620 L 0,700 L 1440,700 Z"
          fill="url(#lp-wave-right)"
          className="dark:opacity-30"
        />
        <path
          d="M 1440,240 C 1240,170 1020,330 780,480 C 540,630 240,580 0,620"
          fill="none"
          stroke="url(#lp-stroke-right)"
          strokeWidth="1.8"
          className="dark:opacity-40"
        />

        {/* Layer 3: Left Secondary Deeper Wave */}
        <path
          d="M 0,390 C 240,320 440,450 720,550 C 1000,650 1240,560 1440,460 L 1440,700 L 0,700 Z"
          fill="url(#lp-wave-left-sub)"
          className="dark:opacity-25"
        />
        <path
          d="M 0,390 C 240,320 440,450 720,550 C 1000,650 1240,560 1440,460"
          fill="none"
          stroke="url(#lp-stroke-left)"
          strokeWidth="1.2"
          strokeOpacity="0.6"
          className="dark:opacity-30"
        />

        {/* Layer 4: Right Secondary Deeper Wave */}
        <path
          d="M 1440,410 C 1200,360 960,470 680,570 C 420,660 180,630 0,660 L 0,700 L 1440,700 Z"
          fill="url(#lp-wave-right-sub)"
          className="dark:opacity-25"
        />

        {/* Layer 5: Bottom Soft Basin Crest */}
        <path
          d="M 0,560 C 360,500 720,630 1080,530 C 1260,480 1380,510 1440,530 L 1440,700 L 0,700 Z"
          fill="url(#lp-wave-crest)"
          className="dark:opacity-20"
        />
      </svg>

      {/* ── Left Floating Translucent Document Elements ── */}
      {/* Top-Left Card (3 clauses) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[20%] left-[3%] xl:left-[6%] 2xl:left-[9%] z-[2] hidden lg:block lp-animate-float-1 select-none"
      >
        <div className="w-32 p-3.5 rounded-2xl bg-white/55 dark:bg-slate-900/50 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(99,102,241,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="h-1.5 w-16 bg-indigo-300/60 dark:bg-indigo-400/30 rounded-full mb-2" />
          <div className="h-1.5 w-24 bg-indigo-200/70 dark:bg-indigo-400/20 rounded-full mb-2" />
          <div className="h-1.5 w-14 bg-indigo-200/50 dark:bg-indigo-400/20 rounded-full" />
        </div>
      </div>

      {/* Middle-Left Main Card (Header + 4 lines) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[42%] left-[1.5%] xl:left-[3.5%] 2xl:left-[6%] z-[2] hidden lg:block lp-animate-float-2 select-none"
      >
        <div className="w-44 p-4 rounded-2xl bg-white/65 dark:bg-slate-900/60 backdrop-blur-lg border border-white/90 dark:border-white/15 shadow-[0_14px_40px_rgba(99,102,241,0.12)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
          <div className="h-2 w-16 bg-indigo-500/60 dark:bg-indigo-400/50 rounded-full mb-3" />
          <div className="h-1.5 w-full bg-indigo-200/70 dark:bg-indigo-400/25 rounded-full mb-2" />
          <div className="h-1.5 w-4/5 bg-indigo-200/60 dark:bg-indigo-400/20 rounded-full mb-2" />
          <div className="h-1.5 w-11/12 bg-indigo-200/70 dark:bg-indigo-400/25 rounded-full mb-2" />
          <div className="h-1.5 w-3/5 bg-indigo-200/50 dark:bg-indigo-400/15 rounded-full" />
        </div>
      </div>

      {/* Bottom-Left Card (3 lines) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[70%] left-[5%] xl:left-[8%] 2xl:left-[11%] z-[2] hidden lg:block lp-animate-float-3 select-none"
      >
        <div className="w-28 p-2.5 rounded-xl bg-white/45 dark:bg-slate-900/40 backdrop-blur-sm border border-white/70 dark:border-white/10 shadow-[0_6px_24px_rgba(99,102,241,0.06)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
          <div className="h-1.5 w-14 bg-indigo-300/50 dark:bg-indigo-400/25 rounded-full mb-1.5" />
          <div className="h-1.5 w-20 bg-indigo-200/60 dark:bg-indigo-400/20 rounded-full mb-1.5" />
          <div className="h-1.5 w-10 bg-indigo-200/40 dark:bg-indigo-400/15 rounded-full" />
        </div>
      </div>

      {/* ── Right Floating Translucent Document Elements ── */}
      {/* Main Right Card with Shield Icon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[42%] right-[1.5%] xl:right-[3.5%] 2xl:right-[6%] z-[2] hidden lg:block lp-animate-float-4 select-none"
      >
        <div className="w-52 p-4 rounded-2xl bg-white/65 dark:bg-slate-900/60 backdrop-blur-lg border border-white/90 dark:border-white/15 shadow-[0_14px_40px_rgba(99,102,241,0.12)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.5)] flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-1.5 w-24 bg-indigo-300/60 dark:bg-indigo-400/30 rounded-full" />
            <div className="h-1.5 w-28 bg-indigo-200/70 dark:bg-indigo-400/20 rounded-full" />
            <div className="h-1.5 w-16 bg-indigo-200/50 dark:bg-indigo-400/15 rounded-full" />
          </div>
        </div>
      </div>

      {/* Top-Right Card (3 lines) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[22%] right-[5%] xl:right-[8%] 2xl:right-[11%] z-[2] hidden lg:block lp-animate-float-5 select-none"
      >
        <div className="w-36 p-3.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(99,102,241,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="h-1.5 w-20 bg-indigo-300/50 dark:bg-indigo-400/25 rounded-full mb-2" />
          <div className="h-1.5 w-28 bg-indigo-200/60 dark:bg-indigo-400/20 rounded-full mb-2" />
          <div className="h-1.5 w-16 bg-indigo-200/40 dark:bg-indigo-400/15 rounded-full" />
        </div>
      </div>

      {/* ── Center Stage Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Subtle Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 mb-6 backdrop-blur-sm shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Competition-Ready Legal AI</span>
        </div>

        {/* Prominent Minimal Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
          Understand your agreements <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            before you sign.
          </span>
        </h2>

        {/* Concise Supporting Copy */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          Experience instant contract analysis, grounded evidence citations, and structured lawyer-ready briefings without a login wall.
        </p>

        {/* Pathway CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-2xl mx-auto">
          <Link
            href="/analysis/demo-employment-agreement"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Try Flagship Demo</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-700/90 text-indigo-100">
              🇮🇳 India
            </span>
          </Link>

          <Link
            href="/review"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/90 hover:bg-white text-slate-800 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-white/10 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm font-semibold backdrop-blur-md cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Document Review</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          </Link>

          <Link
            href="/compare"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/90 hover:bg-white text-slate-800 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-white/10 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm font-semibold backdrop-blur-md cursor-pointer"
          >
            <GitCompare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Compare Redlines</span>
          </Link>
        </div>

        {/* Security & Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Zero Registration Required
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            Private & Encrypted Processing
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Instant Evaluation
          </span>
        </div>
      </div>
    </section>
  );
}
