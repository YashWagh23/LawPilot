export default function CompareLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-56" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-10 flex flex-col items-center gap-3">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-40" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="h-11 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}
