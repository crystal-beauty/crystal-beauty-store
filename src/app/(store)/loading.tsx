export default function StoreLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 rounded-full border-2 border-[var(--primary)]/10 border-t-[var(--gold)] animate-spin" />
        </div>
        <p className="text-xs text-muted-foreground tracking-wide">…</p>
      </div>
    </div>
  );
}
