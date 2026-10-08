"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Truck, Loader2, X, Save } from "lucide-react";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RateRow {
  id: string;
  carrier: string;
  name: string;
  country: string;
  city: string | null;
  price: number;
  estimatedDays: string;
  freeOver: number | null;
  active: boolean;
  sortOrder: number;
}

const emptyRate = { name: "", carrier: "World Express", country: "*", city: "", price: "", estimatedDays: "3-7", freeOver: "", active: true, sortOrder: 0 };

export default function ShippingManager({ canDelete }: { canDelete: boolean }) {
  const settings = useSettings();
  const [rates, setRates] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RateRow | null>(null);
  const [form, setForm] = useState(emptyRate);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RateRow | null>(null);

  // World Express API config
  const [wx, setWx] = useState({
    worldExpressEnabled: settings.worldExpressEnabled,
    worldExpressApiUrl: settings.worldExpressApiUrl,
    worldExpressApiKey: settings.worldExpressApiKey,
    worldExpressCustomerId: settings.worldExpressCustomerId,
    originCountry: settings.originCountry,
    freeShippingThreshold: String(settings.freeShippingThreshold),
  });
  const [wxSaving, setWxSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shipping-rates");
      const data = await res.json();
      setRates(data.rates || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveWxConfig() {
    setWxSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wx),
      });
      if (!res.ok) return toast.error("Could not save the World Express settings");
      toast.success("World Express settings saved");
    } finally {
      setWxSaving(false);
    }
  }

  async function saveRate() {
    if (!form.name.trim() || form.price === "") return toast.error("Method name and price are required");
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/shipping-rates/${editing.id}` : "/api/admin/shipping-rates", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          freeOver: form.freeOver ? parseFloat(form.freeOver) : null,
          country: form.country || "*",
          city: form.city || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Could not save");
      toast.success(editing ? "Shipping rate updated" : "Shipping rate created");
      setDialogOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/shipping-rates/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Shipping rate deleted");
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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Shipping & World Express</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your delivery partner and the rates customers see at checkout.
        </p>
      </div>

      {/* ===== World Express API config ===== */}
      <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/5 flex items-center justify-center">
            <Truck className="h-5 w-5 text-[var(--gold)]" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--primary)]">World Express API</h2>
            <p className="text-xs text-muted-foreground">Used to book shipments directly from orders.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5 text-sm text-[var(--primary)]">
              <input
                type="checkbox"
                checked={wx.worldExpressEnabled}
                onChange={(e) => setWx({ ...wx, worldExpressEnabled: e.target.checked })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              World Express integration enabled
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>API Endpoint URL</label>
            <input
              value={wx.worldExpressApiUrl}
              onChange={(e) => setWx({ ...wx, worldExpressApiUrl: e.target.value })}
              className={inputCls}
              placeholder="https://api.worldexpress.com/v1/shipments"
            />
          </div>
          <div>
            <label className={labelCls}>API Key / Token</label>
            <input
              type="password"
              value={wx.worldExpressApiKey}
              onChange={(e) => setWx({ ...wx, worldExpressApiKey: e.target.value })}
              className={inputCls}
              placeholder="Sent as Bearer token"
            />
          </div>
          <div>
            <label className={labelCls}>Customer / Account ID</label>
            <input
              value={wx.worldExpressCustomerId}
              onChange={(e) => setWx({ ...wx, worldExpressCustomerId: e.target.value })}
              className={inputCls}
              placeholder="Your World Express account number"
            />
          </div>
          <div>
            <label className={labelCls}>Origin Country</label>
            <input
              value={wx.originCountry}
              onChange={(e) => setWx({ ...wx, originCountry: e.target.value })}
              className={inputCls}
              placeholder="United Arab Emirates"
            />
          </div>
          <div>
            <label className={labelCls}>Free Shipping Threshold ({settings.currencyCode})</label>
            <input
              type="number"
              value={wx.freeShippingThreshold}
              onChange={(e) => setWx({ ...wx, freeShippingThreshold: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <button
          onClick={saveWxConfig}
          disabled={wxSaving}
          className="mt-5 inline-flex items-center gap-2 bg-[var(--gold)] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#b8903a] transition-colors disabled:opacity-60"
        >
          {wxSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save World Express Settings
        </button>
      </section>

      {/* ===== Rates ===== */}
      <section className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--primary)]">Shipping Rates</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
            City-specific rates win over country rates, which win over the worldwide (*) fallback.
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm(emptyRate); setDialogOpen(true); }}
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Rate
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading rates…</div>
        ) : rates.length === 0 ? (
          <div className="py-16 text-center">
            <Truck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--primary)]">No shipping rates yet</p>
            <p className="text-xs text-muted-foreground mt-1">Customers can&apos;t check out without at least one rate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-5 py-3 font-semibold text-[var(--primary)]">Method</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Destination</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Price</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">ETA</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Status</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[var(--primary)]">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.carrier}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.city ? `${r.city}, ` : ""}{r.country === "*" ? "Worldwide" : r.country}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--primary)]">
                      {formatMoney(r.price, settings)}
                      {r.freeOver && <span className="block text-[11px] font-normal text-muted-foreground">free over {formatMoney(r.freeOver, settings)}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.estimatedDays} days</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                          r.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                        )}
                      >
                        {r.active ? "Active" : "Off"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(r);
                            setForm({
                              name: r.name, carrier: r.carrier, country: r.country, city: r.city || "",
                              price: String(r.price), estimatedDays: r.estimatedDays,
                              freeOver: r.freeOver ? String(r.freeOver) : "", active: r.active, sortOrder: r.sortOrder,
                            });
                            setDialogOpen(true);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-[var(--primary)] hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(r)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Rate dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDialogOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-luxe-lg p-6 max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-[var(--primary)]">{editing ? "Edit Rate" : "New Shipping Rate"}</h2>
              <button onClick={() => setDialogOpen(false)} className="p-2 text-muted-foreground hover:text-[var(--primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Method Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Express Air" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Country (* = worldwide)</label>
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} placeholder="United States" />
                </div>
                <div>
                  <label className={labelCls}>City (optional)</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} placeholder="New York" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Price ({settings.currencyCode}) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} placeholder="15" />
                </div>
                <div>
                  <label className={labelCls}>Free Over (optional)</label>
                  <input type="number" step="0.01" value={form.freeOver} onChange={(e) => setForm({ ...form, freeOver: e.target.value })} className={inputCls} placeholder="120" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Estimated Days</label>
                  <input value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} className={inputCls} placeholder="3-7" />
                </div>
                <div>
                  <label className={labelCls}>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className={inputCls} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-[var(--primary)]">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                Active at checkout
              </label>
              <button
                onClick={saveRate}
                disabled={saving}
                className="w-full bg-[var(--gold)] text-white font-semibold py-3 rounded-xl hover:bg-[#b8903a] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Rate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Customers will no longer see this shipping option at checkout.</AlertDialogDescription>
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
