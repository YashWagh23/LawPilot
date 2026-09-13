"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (!mounted) {
    // SSR / pre-hydration placeholder with identical dimensions to prevent layout shift
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-8.5 w-8.5 rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-2xs shrink-0",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex h-8.5 w-8.5 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer select-none shrink-0 overflow-hidden",
        // Focus state
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
        // Light mode styling (clean white surface, crisp border)
        "border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95",
        // Dark mode styling (translucent dark surface, subtle hairline border)
        "dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-none dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white",
        className
      )}
    >
      <span className="sr-only">{label}</span>

      {/* Animated icon container */}
      <div className="relative flex h-4 w-4 items-center justify-center pointer-events-none">
        {/* Sun icon — visible in Dark Mode (action: switch to light mode) */}
        <Sun
          className={cn(
            "h-4 w-4 stroke-[1.8] absolute transition-all duration-300 ease-out",
            isDark
              ? "opacity-100 scale-100 rotate-0 text-slate-200 group-hover:text-white"
              : "opacity-0 scale-40 rotate-90 text-amber-500"
          )}
        />

        {/* Crescent Moon icon — visible in Light Mode (action: switch to dark mode) */}
        <Moon
          className={cn(
            "h-4 w-4 stroke-[1.8] absolute transition-all duration-300 ease-out",
            !isDark
              ? "opacity-100 scale-100 rotate-0 text-slate-700 group-hover:text-slate-900"
              : "opacity-0 scale-40 -rotate-90 text-slate-400"
          )}
        />
      </div>
    </button>
  );
}
