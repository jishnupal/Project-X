export function SessionLoading() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-surface px-6">
      <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-lg animate-pulse">
        B
      </div>
      <p className="text-[13px] text-secondary">Loading…</p>
    </div>
  );
}
