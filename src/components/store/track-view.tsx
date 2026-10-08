"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageSearch, Loader2, MapPin, Truck, CheckCircle2, Clock } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useSettings } from "@/components/store/settings-provider";
import { cn } from "@/lib/utils";

interface TrackedOrder {
  orderNumber: string;
  status: string;
  customerName: string;
  createdAt: string;
  shippingMethodName: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  shipmentStatus: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  total: number;
  city: string;
  country: string;
  items: { productName: string; productImage: string; quantity: number; giftBox: boolean; lineTotal: number }[];
}

const STEPS = [
  { key: "PENDING", label: "Order Placed" },
  { key: "PROCESSING", label: "Preparing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

const STEP_INDEX: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: -1,
};

export default function TrackView() {
  const settings = useSettings();
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order not found.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]";

  const currentStep = order ? STEP_INDEX[order.status] ?? 0 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-10">
        <PackageSearch className="h-12 w-12 text-[var(--gold)] mx-auto mb-4" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">Track Your Order</h1>
        <p className="mt-3 text-muted-foreground">
          Enter your order number to follow your gift&apos;s journey with World Express.
        </p>
      </div>

      <form onSubmit={lookup} className="bg-white rounded-2xl border border-border p-6 shadow-luxe space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="tr-order">Order Number *</label>
            <input
              id="tr-order"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="LG-XXXXXX"
              className={cn(inputCls, "uppercase")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="tr-email">Email (optional)</label>
            <input id="tr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="For extra verification" className={inputCls} />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium py-3.5 rounded-full hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
          Find My Order
        </button>
        {error && <p className="text-sm text-destructive text-center bg-destructive/5 border border-destructive/20 rounded-xl py-3 px-4">{error}</p>}
      </form>

      {/* Result */}
      {order && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <p className="font-display text-xl font-semibold text-[var(--primary)]">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {order.city}, {order.country}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "inline-block text-xs font-semibold px-3 py-1 rounded-full border",
                  order.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  order.status === "CANCELLED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                  "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/30"
                )}>
                  {order.status}
                </p>
                <p className="text-sm font-semibold text-[var(--primary)] mt-1.5">{formatMoney(order.total, settings)}</p>
              </div>
            </div>

            {/* Timeline */}
            {order.status !== "CANCELLED" && (
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-[var(--gold)] transition-all"
                  style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - ${currentStep > 0 ? 8 : 0}px)` }}
                />
                <div className="relative grid grid-cols-4">
                  {STEPS.map((step, i) => {
                    const done = i <= currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full border-2 flex items-center justify-center bg-white z-10",
                            done ? "border-[var(--gold)]" : "border-muted"
                          )}
                        >
                          {i < currentStep ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-[var(--gold)]" />
                          ) : done ? (
                            <Clock className="h-4 w-4 text-[var(--gold)]" />
                          ) : (
                            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
                          )}
                        </div>
                        <p className={cn("mt-2 text-[11px] font-medium text-center", done ? "text-[var(--primary)]" : "text-muted-foreground")}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {order.trackingNumber && (
              <div className="mt-6 rounded-xl bg-muted px-4 py-3.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <Truck className="h-4.5 w-4.5 text-[var(--gold)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">
                      {order.carrier || "World Express"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span>
                      {order.shipmentStatus && ` · ${order.shipmentStatus}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="text-sm font-semibold text-[var(--primary)] mb-4">Items in this order</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {item.productImage && (
                       
                      <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--primary)] truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">×{item.quantity}{item.giftBox ? " · Gift box" : ""}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--primary)]">{formatMoney(item.lineTotal, settings)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
