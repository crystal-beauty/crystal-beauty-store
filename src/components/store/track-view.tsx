"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageSearch, Loader2, MapPin, Truck, CheckCircle2, Clock, Building, AlertTriangle, Ban } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useSettings } from "@/components/store/settings-provider";
import { useT, useLang } from "@/components/store/locale-provider";
import { cn } from "@/lib/utils";
import { t as tr } from "@/lib/i18n";

interface TrackedOrder {
  orderNumber: string;
  status: string;
  customerName: string;
  createdAt: string;
  deliveryType: string;
  carrier: string | null;
  trackingNumber: string | null;
  carrierStatus: string | null;
  globalStatus: string | null;
  total: number;
  wilayaName: string;
  commune: string;
  items: { productName: string; productImage: string; quantity: number; giftBox: boolean; lineTotal: number }[];
}

const STEPS = [
  { key: "NEW", labelKey: "statusNew" as const },
  { key: "CONFIRMED", labelKey: "statusConfirmed" as const },
  { key: "SENT_TO_CARRIER", labelKey: "statusSentToCarrier" as const },
  { key: "IN_DELIVERY", labelKey: "statusInDelivery" as const },
  { key: "DELIVERED", labelKey: "statusDelivered" as const },
];

const STEP_INDEX: Record<string, number> = {
  NEW: 0,
  CONFIRMED: 1,
  SENT_TO_CARRIER: 2,
  IN_DELIVERY: 3,
  DELIVERED: 4,
};

export default function TrackView() {
  const settings = useSettings();
  const params = useSearchParams();
  const lang = useLang();
  const t = useT();
  const [orderNumber, setOrderNumber] = useState(params.get("order") || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "TOO_MANY_ATTEMPTS" ? tr("errorGeneric", lang) : t("trackNotFound"));
      } else {
        setOrder(data.order);
      }
    } catch {
      setError(tr("errorGeneric", lang));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]";

  const currentStep = order ? STEP_INDEX[order.status] ?? 0 : 0;
  const badEnd = order && ["REFUSED", "RETURNED", "CANCELLED"].includes(order.status);

  const statusLabel = (s: string) =>
    ({
      NEW: t("statusNew"),
      CONFIRMED: t("statusConfirmed"),
      SENT_TO_CARRIER: t("statusSentToCarrier"),
      IN_DELIVERY: t("statusInDelivery"),
      DELIVERED: t("statusDelivered"),
      REFUSED: t("statusRefused"),
      RETURNED: t("statusReturned"),
      CANCELLED: t("statusCancelled"),
    })[s] || s;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-10">
        <PackageSearch className="h-12 w-12 text-[var(--brand)] mx-auto mb-4" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">{t("trackTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("trackSubtitle")}</p>
      </div>

      <form onSubmit={lookup} className="bg-white rounded-2xl border border-border p-6 shadow-luxe space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="tr-order">
              {t("thankYouNumber")} *
            </label>
            <input
              id="tr-order"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="LG-XXXXXX"
              className={cn(inputCls, "uppercase")}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="tr-phone">
              {t("yourPhone")} *
            </label>
            <input
              id="tr-phone"
              required
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="0555 12 34 56"
              className={cn(inputCls, "tracking-wider")}
              dir="ltr"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium py-3.5 rounded-full hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
          {t("trackCta")}
        </button>
        {error && (
          <p className="text-sm text-destructive text-center bg-destructive/5 border border-destructive/20 rounded-xl py-3 px-4">{error}</p>
        )}
      </form>

      {/* Result */}
      {order && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <p className="font-display text-xl font-semibold text-[var(--primary)]" dir="ltr">
                  {order.orderNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {order.commune}, {order.wilayaName}
                  {order.deliveryType === "STOP_DESK" && (
                    <span className="inline-flex items-center gap-1">
                      <Building className="h-3 w-3" /> ({t("stopDesk")})
                    </span>
                  )}
                </p>
              </div>
              <div className="text-end">
                <p
                  className={cn(
                    "inline-block text-xs font-semibold px-3 py-1 rounded-full border",
                    order.status === "DELIVERED"
                      ? "bg-[var(--primary)] text-white border-transparent"
                      : badEnd
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/30"
                  )}
                >
                  {statusLabel(order.status)}
                </p>
                <p className="text-sm font-semibold text-[var(--primary)] mt-1.5">{formatMoney(order.total)}</p>
              </div>
            </div>

            {/* Timeline (hidden for refused/returned/cancelled) */}
            {!badEnd && (
              <div className="relative">
                <div className="absolute top-4 start-4 end-4 h-0.5 bg-muted" />
                <div
                  className="absolute top-4 start-4 h-0.5 bg-[var(--brand)] transition-all"
                  style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - 8px)` }}
                />
                <div className="relative grid grid-cols-5">
                  {STEPS.map((step, i) => {
                    const done = i <= currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full border-2 flex items-center justify-center bg-white z-10",
                            done ? "border-[var(--brand)]" : "border-muted"
                          )}
                        >
                          {i < currentStep ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-[var(--brand)]" />
                          ) : done ? (
                            <Clock className="h-4 w-4 text-[var(--brand)]" />
                          ) : (
                            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
                          )}
                        </div>
                        <p className={cn("mt-2 text-[10px] sm:text-[11px] font-medium text-center", done ? "text-[var(--primary)]" : "text-muted-foreground")}>
                          {t(step.labelKey)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {badEnd && (
              <div
                className={cn(
                  "rounded-xl px-4 py-3.5 flex items-center gap-2.5 text-sm bg-rose-50 text-rose-800"
                )}
              >
                {order.status === "REFUSED" ? <AlertTriangle className="h-4.5 w-4.5 shrink-0" /> : <Ban className="h-4.5 w-4.5 shrink-0" />}
                {statusLabel(order.status)}
              </div>
            )}

            {order.trackingNumber && (
              <div className="mt-6 rounded-xl bg-muted px-4 py-3.5 flex items-center gap-2.5">
                <Truck className="h-4.5 w-4.5 text-[var(--brand)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--primary)]">
                    {t("carrierStatus")}
                    {order.carrier ? ` — ${order.carrier}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" dir="ltr">
                    {order.trackingNumber}
                    {order.carrierStatus ? ` · ${order.carrierStatus.replace(/_/g, " ")}` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="text-sm font-semibold text-[var(--primary)] mb-4">{t("itemsInOrder")}</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--primary)] truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      ×{item.quantity}
                      {item.giftBox ? ` · ${t("giftBox")}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--primary)]">{formatMoney(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
