import React from "react";
import { cn } from "@/lib/utils";
import type { SeverityLevel } from "@/types";
import { AlertCircle, AlertTriangle, HelpCircle, Info } from "lucide-react";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
  showIcon?: boolean;
}

export function SeverityBadge({
  severity,
  className,
  showIcon = true,
}: SeverityBadgeProps) {
  switch (severity) {
    case "high_attention":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
            className
          )}
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5" />}
          High Attention
        </span>
      );
    case "review":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/25 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50",
            className
          )}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5" />}
          Review
        </span>
      );
    case "context_dependent":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/25 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50",
            className
          )}
        >
          {showIcon && <HelpCircle className="w-3.5 h-3.5" />}
          Context Dependent
        </span>
      );
    case "informational":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-500/10 text-slate-600 border border-slate-500/20 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800",
            className
          )}
        >
          {showIcon && <Info className="w-3.5 h-3.5" />}
          Informational
        </span>
      );
  }
}
