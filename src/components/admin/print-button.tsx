"use client";

import { Printer, ArrowLeft } from "lucide-react";

export default function PrintButton() {
  return (
    <div className="mt-5 flex gap-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90"
      >
        <Printer className="h-4 w-4" /> Imprimer
      </button>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 border border-border text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
    </div>
  );
}
