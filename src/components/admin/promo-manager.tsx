"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, TicketPercent, Loader2, X } from "lucide-react";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PromoRow {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

const empty = { code: "", type: "PERCENT", value: "", minOrder: "", maxUses: "", expiresAt: "", active: true };

export default function PromoManager({ canDelete }: { canDelete: boolean }) {
  const settings = useSettings();
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromoRow | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromoRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes");
      const data = await res.json();
      setPromos(data.promoCodes || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(p: PromoRow) {
    setEditing(p);
    setForm({
      code: p.code,
      type: p.type,
      value: String(p.value),
      minOrder: String(p.minOrder),
      maxUses: p.maxUses ? String(p.maxUses) : "",
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 10) : "",
      active: p.active,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.code.trim() || !form.value) return toast.error("Code and value are required");
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/promo-codes/${editing.id}` : "/api/admin/promo-codes", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: parseFloat(form.value),
          minOrder: parseFloat(form.minOrder) || 0,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Could not save");
      toast.success(editing ? "Promo code updated" : "Promo code created");
      setDialogOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/promo-codes/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Promo code deleted");
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Could not delete");
    }
    setDeleteTarget(null);
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Promo Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">Run campaigns and reward loyal gifters.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(empty); setDialogOpen(true); }}
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Promo Code
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : promos.length === 0 ? (
          <div className="py-16 text-center">
            <TicketPercent className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--primary)]">No promo codes yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create one to run your first campaign.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {promos.map((p) => {
              const expired = p.expiresAt && new Date(p.expiresAt) < new Date();
              const exhausted = p.maxUses !== null && p.usedCount >= p.maxUses;
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[var(--primary)] bg-muted rounded-lg px-2.5 py-1 text-sm">{p.code}</span>
                      <span className="text-sm font-semibold text-[var(--gold)]">
                        {p.type === "PERCENT" ? `${p.value}% off` : `${formatMoney(p.value, settings)} off`}
                      </span>
                      {p.minOrder > 0 && (
                        <span className="text-xs text-muted-foreground">min {formatMoney(p.minOrder, settings)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Used {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ""} times
                      {p.expiresAt && ` · expires ${new Date(p.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0",
                      !p.active || expired || exhausted
                        ? "bg-gray-100 text-gray-500 border-gray-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}
                  >
                    {!p.active ? "Paused" : expired ? "Expired" : exhausted ? "Used up" : "Active"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-muted-foreground hover:text-[var(--primary)] hover:bg-muted">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {canDelete && (
                      <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDialogOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-luxe-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-[var(--primary)]">{editing ? "Edit Promo Code" : "New Promo Code"}</h2>
              <button onClick={() => setDialogOpen(false)} className="p-2 text-muted-foreground hover:text-[var(--primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className={cn(inputCls, "uppercase font-mono")}
                    placeholder="WELCOME10"
                    disabled={!!editing}
                  />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                    <option value="PERCENT">Percentage off</option>
                    <option value="FIXED">Fixed amount off</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{form.type === "PERCENT" ? "Discount %" : `Discount (${settings.currencyCode})`} *</label>
                  <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputCls} placeholder="10" />
                </div>
                <div>
                  <label className={labelCls}>Minimum Order</label>
                  <input type="number" step="0.01" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className={inputCls} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Max Uses (blank = ∞)</label>
                  <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className={inputCls} placeholder="100" />
                </div>
                <div>
                  <label className={labelCls}>Expires On</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-[var(--primary)]">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                Active (customers can use it)
              </label>
              <button
                onClick={save}
                disabled={saving}
                className="w-full bg-[var(--gold)] text-white font-semibold py-3 rounded-xl hover:bg-[#b8903a] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Promo Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.code}”?</AlertDialogTitle>
            <AlertDialogDescription>Customers will no longer be able to use this code. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
