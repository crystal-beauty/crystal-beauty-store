"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Phone, MessageCircle, Truck, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { formatMoney, ORDER_STATUSES } from "@/lib/format";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/format";
import { toInternationalDz, WILAYAS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  phone: string;
  wilayaName: string;
  commune: string;
  deliveryType: string;
  total: number;
  trackingNumber: string | null;
  refusedWarning: boolean;
  createdAt: string;
  items: { id: string; productName: string; quantity: number }[];
}

export default function OrdersManager() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => {
    const s = searchParams.get("status");
    return s && (ORDER_STATUSES as readonly string[]).includes(s) ? s : "ALL";
  });
  const [wilaya, setWilaya] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      if (wilaya) params.set("wilaya", wilaya);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Impossible de charger les commandes.");
    } finally {
      setLoading(false);
    }
  }, [search, status, wilaya, from, to]);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  const selectable = useMemo(() => orders.filter((o) => ["NEW", "CONFIRMED"].includes(o.status) && !o.trackingNumber), [orders]);
  const allSelected = selectable.length > 0 && selectable.every((o) => selected.has(o.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectable.map((o) => o.id)));
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkShip() {
    if (selected.size === 0) return;
    setBulkSending(true);
    try {
      const res = await fetch("/api/admin/orders/bulk-ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      const okCount = (data.results || []).filter((r: { ok: boolean }) => r.ok).length;
      const errors = (data.results || []).filter((r: { ok: boolean }) => !r.ok);
      if (okCount) toast.success(`${okCount} colis créés${okCount > 1 ? "s" : ""} chez World Express.`);
      errors.forEach((r: { orderNumber: string; error?: string }) => toast.error(`${r.orderNumber}: ${r.error?.slice(0, 90) || "échec"}`, { duration: 8000 }));
      setSelected(new Set());
      await load();
    } catch {
      toast.error("Échec de l'envoi groupé.");
    } finally {
      setBulkSending(false);
    }
  }

  async function syncStatuses() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/carrier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Transporteur synchronisé — ${data.checked} colis vérifiés, ${data.updated.length} mis à jour.`);
        await load();
      }
    } catch {
      toast.error("Synchronisation impossible.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "bg-white border border-input rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]";

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--primary)]">Commandes</h1>
          <p className="text-sm text-muted-foreground mt-1">Paiement à la livraison — {orders.length} commande(s)</p>
        </div>
        <button onClick={syncStatuses} className="inline-flex items-center gap-2 border border-border bg-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-muted transition-colors">
          <RefreshCw className="h-4 w-4" /> Sync transporteur
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-luxe mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Téléphone, nom, n° commande, suivi…"
            className={cn(inputCls, "w-full ps-10")}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          <option value="ALL">Tous les statuts</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={wilaya} onChange={(e) => setWilaya(e.target.value)} className={inputCls}>
          <option value="">Toutes les wilayas</option>
          {WILAYAS.map((w) => (
            <option key={w.id} value={w.fr}>
              {w.id} — {w.fr}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={cn(inputCls, "w-full")} aria-label="Du" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={cn(inputCls, "w-full")} aria-label="Au" />
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="mb-4 rounded-xl bg-[var(--primary)] text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium">{selected.size} commande(s) sélectionnée(s)</span>
          <button onClick={bulkShip} disabled={bulkSending} className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[#16305c] text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50">
            {bulkSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Envoyer au transporteur
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-[var(--primary)]" aria-label="Tout sélectionner" />
                </th>
                <th className="px-4 py-3 text-start">Commande</th>
                <th className="px-4 py-3 text-start">Client</th>
                <th className="px-4 py-3 text-start">Destination</th>
                <th className="px-4 py-3 text-start">Montant</th>
                <th className="px-4 py-3 text-start">Statut</th>
                <th className="px-4 py-3 text-start">Suivi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Aucune commande pour ces filtres.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const selectableRow = ["NEW", "CONFIRMED"].includes(o.status) && !o.trackingNumber;
                  return (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        {selectableRow && (
                          <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} className="h-4 w-4 accent-[var(--primary)]" aria-label={`Sélectionner ${o.orderNumber}`} />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-[var(--primary)] hover:text-[var(--brand)]" dir="ltr">
                          {o.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{o.customerName}</span>
                          {o.refusedWarning && (
                            <span title="Refus/retour précédent sur ce numéro" className="inline-flex items-center">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <a href={`tel:${o.phone}`} className="text-xs text-muted-foreground hover:text-[var(--primary)] inline-flex items-center gap-1" dir="ltr">
                            <Phone className="h-3 w-3" /> {o.phone}
                          </a>
                          <a
                            href={`https://wa.me/${toInternationalDz(o.phone).replace("+", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--primary)] hover:text-[#2c4a7c]"
                            aria-label="WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {o.commune}
                        <span className="block text-xs">
                          {o.wilayaName} · {o.deliveryType === "STOP_DESK" ? "Stop desk" : "Domicile"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--primary)] whitespace-nowrap">{formatMoney(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border", STATUS_STYLES[o.status])}>{STATUS_LABELS[o.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">
                        {o.trackingNumber || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
