export default function SituationLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-52" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-72" />
      </div>

      <div className="space-y-3">
        <div className="h-40 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800" />
        <div className="flex justify-end">
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
        ))}
      </div>
    </div>
  );
}
