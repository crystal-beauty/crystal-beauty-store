"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Truck, Save, Loader2, MapPin, Mail, Phone, CreditCard, Gift,
  StickyNote, PackageCheck, Trash2, ExternalLink,
} from "lucide-react";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney, STATUS_STYLES, ORDER_STATUSES } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string | null;
  notes: string | null;
  giftMessage: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  giftBoxFee: number;
  total: number;
  promoCodeStr: string | null;
  shippingMethodName: string | null;
  paymentMethod: string;
  carrier: string | null;
  trackingNumber: string | null;
  shipmentStatus: string | null;
  shipmentResponse: string | null;
  createdAt: string;
  items: {
    productName: string;
    productImage: string;
    variantSelections: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    giftBox: boolean;
  }[];
}

export default function OrderDetail({ order: initial, canDelete }: { order: OrderData; canDelete: boolean }) {
  const router = useRouter();
  const settings = useSettings();
  const [order, setOrder] = useState(initial);
  const [status, setStatus] = useState(initial.status);
  const [tracking, setTracking] = useState(initial.trackingNumber || "");
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function saveOrder() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingNumber: tracking, carrier: order.carrier || "World Express" }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Could not update");
      setOrder(data.order);
      toast.success("Order updated");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function bookShipment() {
    setBooking(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/ship`, { method: "POST" });
      const data = await res.json();
      if (data.order) setOrder(data.order);
      if (data.order?.trackingNumber) setTracking(data.order.trackingNumber);
      if (res.ok) {
        toast.success(`World Express shipment booked — tracking ${data.trackingNumber}`);
      } else {
        toast.error(data.error || "Booking failed");
      }
      router.refresh();
    } finally {
      setBooking(false);
    }
  }

  async function deleteOrder() {
    const res = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Order deleted");
      router.push("/admin/orders");
    } else {
      const d = await res.json();
      toast.error(d.error || "Could not delete");
    }
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="p-2.5 rounded-xl border border-border bg-white text-[var(--primary)] hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-2xl font-semibold text-[var(--primary)]">{order.orderNumber}</h1>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status] || ""}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Placed {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 border border-destructive/30 text-destructive text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete Order
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ===== Main ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0">
                    {item.productImage && (
                       
                      <img src={item.productImage} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--primary)]">{item.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.variantSelections !== "{}" &&
                        Object.entries(JSON.parse(item.variantSelections || "{}"))
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                    </p>
                    {item.giftBox && (
                      <p className="text-xs text-[var(--gold)] font-medium mt-0.5 flex items-center gap-1">
                        <Gift className="h-3 w-3" /> Customer requested a gift box
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--primary)]">{formatMoney(item.lineTotal, settings)}</p>
                    <p className="text-xs text-muted-foreground">×{item.quantity} @ {formatMoney(item.unitPrice, settings)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-5 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatMoney(order.subtotal, settings)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount {order.promoCodeStr && `(${order.promoCodeStr})`}</span>
                  <span>-{formatMoney(order.discount, settings)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{order.shippingFee === 0 ? "FREE" : formatMoney(order.shippingFee, settings)}</span></div>
              {order.giftBoxFee > 0 && (
                <div className="flex justify-between text-muted-foreground"><span>Gift boxes</span><span>{formatMoney(order.giftBoxFee, settings)}</span></div>
              )}
              <div className="flex justify-between border-t border-border pt-2.5 font-bold text-[var(--primary)]">
                <span>Total</span><span>{formatMoney(order.total, settings)}</span>
              </div>
            </div>
          </section>

          {/* Shipping / World Express */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-1 flex items-center gap-2">
              <Truck className="h-5 w-5 text-[var(--gold)]" /> Shipment — World Express
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Book the shipment through the World Express API or enter the tracking number manually.
            </p>

            {order.shipmentStatus && (
              <div className={cn(
                "mb-4 rounded-xl px-4 py-3 text-sm border",
                order.shipmentStatus === "BOOKED" || order.shipmentStatus === "SHIPPED"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              )}>
                Shipment status: <strong>{order.shipmentStatus}</strong>
                {order.carrier && <> · Carrier: <strong>{order.carrier}</strong></>}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-5">
              <button
                onClick={bookShipment}
                disabled={booking}
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 disabled:opacity-60 transition-colors"
              >
                {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                Book World Express Shipment
              </button>
              {order.trackingNumber && (
                <span className="inline-flex items-center gap-2 bg-muted text-[var(--primary)] text-sm font-medium px-4 py-2.5 rounded-xl">
                  <Truck className="h-4 w-4 text-[var(--gold)]" /> Tracking: <span className="font-mono">{order.trackingNumber}</span>
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tracking Number</label>
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputCls} placeholder="WE-123456789" />
              </div>
              <div>
                <label className={labelCls}>Order Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {order.shipmentResponse && (
              <details className="mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-[var(--primary)]">View raw API response</summary>
                <pre className="mt-2 text-[11px] bg-muted rounded-xl p-3 overflow-x-auto scrollbar-thin max-h-48">{(() => {
                  try { return JSON.stringify(JSON.parse(order.shipmentResponse), null, 2); } catch { return order.shipmentResponse; }
                })()}</pre>
              </details>
            )}
          </section>

          {/* Customer notes */}
          {(order.notes || order.giftMessage) && (
            <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
              <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4 flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-[var(--gold)]" /> Notes from the Customer
              </h2>
              {order.giftMessage && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-[var(--gold)] uppercase tracking-wide mb-1">Gift Message</p>
                  <p className="text-sm text-[var(--primary)] bg-[var(--gold)]/5 border border-[var(--gold)]/20 rounded-xl px-4 py-3">
                    &ldquo;{order.giftMessage}&rdquo;
                  </p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Order Notes</p>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* ===== Side ===== */}
        <div className="space-y-6">
          {/* Customer */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Customer</h2>
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[var(--primary)]">{order.customerName}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {order.email}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {order.phone}</p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{order.address}, {order.city}{order.postalCode && `, ${order.postalCode}`}, {order.country}</span>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                {order.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}
              </p>
              {order.shippingMethodName && (
                <p className="text-xs bg-muted rounded-lg px-3 py-2 text-[var(--primary)]">
                  🚚 {order.shippingMethodName}
                </p>
              )}
            </div>
          </section>

          {/* Save */}
          <button
            onClick={saveOrder}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-white font-semibold py-3.5 rounded-xl hover:bg-[#b8903a] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>

          <Link
            href={`/track?order=${order.orderNumber}`}
            target="_blank"
            className="w-full inline-flex items-center justify-center gap-2 border border-border text-[var(--primary)] text-sm font-medium py-3 rounded-xl hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Customer Tracking View
          </Link>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order {order.orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the order and its items. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteOrder(); }} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
