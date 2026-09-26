import Link from "next/link";
import { ArrowRight, FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">
          404
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <Link
          href="/review"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900 font-medium text-xs hover:bg-blue-100 transition-colors"
        >
          <span>Analyze a Document</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
