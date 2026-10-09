export default function StoreLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 rounded-full border-2 border-[var(--primary)]/10 border-t-[var(--brand)] animate-spin" />
        </div>
        <span className="sr-only">Chargement…</span>
      </div>
    </div>
  );
}
