export default function ReviewLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-80" />
      </div>

      {/* Upload zone skeleton */}
      <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-16 flex flex-col items-center gap-4">
        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="space-y-2 w-full max-w-xs">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4 mx-auto" />
        </div>
      </div>

      {/* Action row skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}
