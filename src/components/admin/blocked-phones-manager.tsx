"use client";

import { useCallback, useEffect, useState } from "react";
import { PhoneOff, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BlockedRow {
  id: string;
  phone: string;
  reason: string | null;
  active: boolean;
  createdAt: string;
}

export default function BlockedPhonesManager() {
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blocked-phones");
      const data = await res.json();
      setRows(data.phones || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blocked-phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Numéro bloqué.");
      setPhone("");
      setReason("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Débloquer ce numéro ?")) return;
    const res = await fetch(`/api/admin/blocked-phones/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Numéro débloqué.");
      await load();
    }
  }

  const inputCls =
    "bg-white border border-input rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--primary)]">Numéros bloqués</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Les numéros bloqués ne peuvent plus passer commande — un message poli leur est affiché.
      </p>

      <form onSubmit={add} className="bg-white rounded-2xl border border-border p-4 shadow-luxe flex gap-3 flex-wrap mb-6">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="0555123456"
          className={inputCls + " w-44"}
          dir="ltr"
          inputMode="numeric"
          required
        />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison (optionnel)" className={inputCls + " flex-1 min-w-48"} />
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Bloquer
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <PhoneOff className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun numéro bloqué.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--primary)]" dir="ltr">
                    {r.phone}
                  </p>
                  {r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={"text-[11px] font-semibold px-2 py-1 rounded-full border " + (r.active ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-muted text-muted-foreground border-border")}>
                    {r.active ? "Bloqué" : "Inactif"}
                  </span>
                  <button onClick={() => remove(r.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl" aria-label="Débloquer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
