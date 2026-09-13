"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Compass,
  GitCompare,
  Scale,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_ITEMS = [
  { href: "/review",    label: "Document Review",    icon: FileText },
  { href: "/compare",   label: "Compare",            icon: GitCompare },
  { href: "/situation", label: "Situation Navigator",icon: Compass },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled
          ? "border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs dark:border-slate-800/80 dark:bg-slate-950/95"
          : "border-b border-transparent bg-white/80 backdrop-blur-sm dark:bg-slate-950/80"
      )}
    >
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Brand ── */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-indigo-600 shadow-xs group-hover:scale-105 transition-transform duration-150">
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                LawPilot
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5 hidden xs:block">
                Understand · Verify · Act
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Right CTAs (Desktop) ── */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/analysis/demo-employment-agreement"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-150"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Try Demo</span>
            <span className="text-[10px]">🇮🇳</span>
          </Link>
          <Link
            href="/review"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors duration-150"
          >
            Analyze Document
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 space-y-1 lp-animate-slide-down">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <Link
              href="/analysis/demo-employment-agreement"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Try Demo (India Flagship) 🇮🇳</span>
            </Link>
            <Link
              href="/review"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center px-3 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg"
            >
              Analyze Document
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
