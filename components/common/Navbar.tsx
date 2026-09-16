"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_ITEMS = [
  { href: "/review",    label: "Review" },
  { href: "/compare",   label: "Compare" },
  { href: "/situation", label: "Situation" },
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
          ? "border-b border-slate-200 bg-white/96 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0C0E14]/96"
          : "border-b border-transparent bg-white/80 backdrop-blur-sm dark:bg-[#0C0E14]/80"
      )}
    >
      <div className="max-w-7xl mx-auto flex h-12 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Brand ── */}
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 group-hover:opacity-85 transition-opacity duration-150">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              LawPilot
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname ? pathname.startsWith(item.href) : false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150",
                    isActive
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-3 py-1.5 rounded hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors duration-150"
          >
            Sample analysis
          </Link>
          <Link
            href="/review"
            className="inline-flex items-center justify-center rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors duration-150"
          >
            Analyze document
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#0C0E14] space-y-0.5 lp-animate-slide-down"
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname ? pathname.startsWith(item.href) : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded text-sm font-medium transition-colors",
                  isActive
                    ? "text-slate-900 dark:text-white font-semibold bg-slate-100/70 dark:bg-slate-800/50"
                    : "text-slate-600 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-800/50"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-1">
            <Link
              href="/analysis/demo-employment-agreement"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
            >
              Sample analysis
            </Link>
            <Link
              href="/review"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center px-3 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded"
            >
              Analyze document
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
