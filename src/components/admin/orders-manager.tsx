"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Eye, Trash2, Truck, Loader2 } from "lucide-react";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney, STATUS_STYLES, ORDER_STATUSES } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  city: string;
  country: string;
  total: number;
  trackingNumber: string | null;
  createdAt: string;
  items: { id: string }[];
}

function OrdersTable({ canDelete }: { canDelete: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const settings = useSettings();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(params.get("status") || "ALL");
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);

  const load = useCallback(async (q: string, st: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${st}&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search, status), 250);
    return () => clearTimeout(t);
  }, [search, status, load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/orders/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Order deleted");
      load(search, status);
    } else {
      const d = await res.json();
      toast.error(d.error || "Could not delete");
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Every gift you&apos;ve shipped, in one place.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order #, name, email or phone…"
            className="w-full bg-white border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {["ALL", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors",
              status === s
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-white text-[var(--primary)] border-border hover:border-[var(--primary)]"
            )}
          >
            {s === "ALL" ? "All Orders" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No orders found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-5 py-3 font-semibold text-[var(--primary)]">Order</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Customer</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Destination</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Items</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Total</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Status</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-[var(--primary)]">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                      {o.trackingNumber && (
                        <p className="text-[11px] text-[var(--gold)] font-medium mt-0.5 flex items-center gap-1">
                          <Truck className="h-3 w-3" /> {o.trackingNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--primary)]">{o.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.city}, {o.country}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.items.length}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--primary)]">{formatMoney(o.total, settings)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[o.status] || ""}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="p-2 rounded-lg text-muted-foreground hover:text-[var(--primary)] hover:bg-muted"
                          title="View / manage"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(o)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete order"
                          >
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
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order {deleteTarget?.orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the order and its items. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive text-white hover:bg-destructive/90">
              <Loader2 className="hidden" /> Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OrdersManager({ canDelete }: { canDelete: boolean }) {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>}>
      <OrdersTable canDelete={canDelete} />
    </Suspense>
  );
}
