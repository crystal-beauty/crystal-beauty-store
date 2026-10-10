"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Home, Building, Loader2, Truck, RefreshCw } from "lucide-react";
import { useLang, useT } from "@/components/store/locale-provider";
import { formatMoney, toInternationalDz } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface WilayaOption {
  id: number;
  fr: string;
  ar: string;
  homeFee: number;
  stopDeskFee: number;
}

export interface CommuneOption {
  name: string;
  wilaya_id: number;
  code_postal: string;
  has_stop_desk: boolean;
}

export interface DeliveryValue {
  wilayaId: number | null;
  commune: string;
  deliveryType: "HOME" | "STOP_DESK";
}

export interface DeliverySelection {
  value: DeliveryValue;
  /** Live official fee in DA — null until a wilaya is chosen. */
  fee: number | null;
  /** "error" → carrier unreachable; "loading" → list still loading. */
  feeState: "idle" | "loading" | "error";
}

export const emptyDelivery: DeliveryValue = { wilayaId: null, commune: "", deliveryType: "HOME" };

export default function DeliverySelector({
  value,
  onChange,
  onFee,
  whatsappNumber = "",
}: {
  value: DeliveryValue;
  onChange: (next: DeliveryValue) => void;
  /** Called whenever the computed fee or its state changes. */
  onFee: (fee: number | null, feeState: DeliverySelection["feeState"]) => void;
  /** Real WhatsApp number from settings — shown only when set. */
  whatsappNumber?: string;
}) {
  const t = useT();
  const lang = useLang();
  const [wilayas, setWilayas] = useState<WilayaOption[] | null>(null);
  const [wilayasError, setWilayasError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  // cache of communes per wilaya id (only setState inside async callbacks)
  const [communesByWilaya, setCommunesByWilaya] = useState<Record<number, CommuneOption[]>>({});
  const [communesError, setCommunesError] = useState(false);

  const communes: CommuneOption[] = value.wilayaId ? communesByWilaya[value.wilayaId] || [] : [];
  const communesLoading = Boolean(value.wilayaId) && communes.length === 0 && !communesError;

  const feeFor = (wid: number | null, type: "HOME" | "STOP_DESK", list: WilayaOption[] | null): number | null => {
    if (!wid || !list) return null;
    const w = list.find((x) => x.id === wid);
    if (!w) return null;
    return type === "STOP_DESK" ? w.stopDeskFee : w.homeFee;
  };

  // Live wilaya list + official fees from the carrier API (cached server-side)
  useEffect(() => {
    fetch("/api/delivery/wilayas")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setWilayas(d.wilayas || []))
      .catch(() => setWilayasError(true));
  }, [retryNonce]);

  /** Retry handler — resets state here (event), then bumps the fetch nonce. */
  function retryWilayas() {
    setWilayas(null);
    setWilayasError(false);
    setCommunesError(false);
    setRetryNonce((n) => n + 1);
  }

  // Report fee state upward whenever it changes (guarded to avoid loops)
  const fee = feeFor(value.wilayaId, value.deliveryType, wilayas);
  const feeState: DeliverySelection["feeState"] = wilayasError ? "error" : !wilayas ? "loading" : "idle";
  const lastReported = useRef("");
  useEffect(() => {
    const key = `${fee}|${feeState}`;
    if (lastReported.current !== key) {
      lastReported.current = key;
      onFee(fee, feeState);
    }
     
  }, [fee, feeState]);

  // Live communes when the wilaya changes (results stored in the cache map)
  useEffect(() => {
    const wid = value.wilayaId;
    if (!wid || communesByWilaya[wid]) return;
    const controller = new AbortController();
    fetch(`/api/delivery/communes?wilaya_id=${wid}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setCommunesByWilaya((prev) => ({ ...prev, [wid]: d.communes || [] })))
      .catch(() => setCommunesError(true));
    return () => controller.abort();
     
  }, [value.wilayaId]);

  const selectedCommune = communes.find((c) => c.name === value.commune);
  const selectedWilaya = wilayas?.find((w) => w.id === value.wilayaId);

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-all";

  function handleWilaya(v: string) {
    const wid = v ? parseInt(v, 10) : null;
    onChange({ wilayaId: wid, commune: "", deliveryType: value.deliveryType || "HOME" });
    const f = feeFor(wid, value.deliveryType || "HOME", wilayas);
    onFee(f, wilayasError ? "error" : !wilayas ? "loading" : f === null && wid ? "error" : "idle");
  }

  function handleCommune(name: string) {
    const c = communes.find((x) => x.name === name);
    // commune without stop desk → force home delivery
    const type = c && !c.has_stop_desk ? "HOME" : value.deliveryType;
    onChange({ ...value, commune: name, deliveryType: type });
    onFee(feeFor(value.wilayaId, type, wilayas), wilayasError ? "error" : "idle");
  }

  function handleType(type: "HOME" | "STOP_DESK") {
    onChange({ ...value, deliveryType: type });
    onFee(feeFor(value.wilayaId, type, wilayas), wilayasError ? "error" : "idle");
  }

  if (wilayasError) {
    // Carrier unreachable — keep the form shape intact (no takeover panel):
    // fields stay in place but disabled, with one compact honest notice.
    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="d-wilaya">
              {t("yourWilaya")} *
            </label>
            <select id="d-wilaya" disabled className={cn(inputCls, "disabled:bg-muted disabled:cursor-not-allowed")}>
              <option>{t("carrierUnavailableShort")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="d-commune">
              {t("yourCommune")} *
            </label>
            <select id="d-commune" disabled className={cn(inputCls, "disabled:bg-muted disabled:cursor-not-allowed")}>
              <option>{t("carrierUnavailableShort")}</option>
            </select>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white px-4 py-3.5 flex items-start gap-3">
          <Truck className="h-4 w-4 text-[var(--brand)] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-relaxed">{t("carrierDownText")}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
              <button
                type="button"
                onClick={retryWilayas}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                <RefreshCw className="h-3 w-3" /> {t("retry")}
              </button>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${toInternationalDz(whatsappNumber).replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Delivery type toggle — Domicile vs Stop Desk */}
      <div>
        <label className="block text-sm font-medium text-[var(--primary)] mb-2">
          {t("deliveryType")} *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 cursor-pointer transition-all shadow-xs",
              value.deliveryType === "HOME"
                ? "border-[var(--primary)] bg-white ring-2 ring-[var(--primary)]/15 shadow-sm"
                : "border-border bg-white/60 hover:bg-white hover:border-[var(--primary)]/30"
            )}
          >
            <input
              type="radio"
              name="dtype"
              checked={value.deliveryType === "HOME"}
              onChange={() => handleType("HOME")}
              className="mt-1 h-4 w-4 accent-[var(--primary)]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Home className="h-4 w-4 text-[var(--brand)] shrink-0" />
                <p className="text-sm font-semibold text-[var(--primary)]">{t("homeDelivery")}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {selectedWilaya ? formatMoney(selectedWilaya.homeFee) : t("homeDeliveryHint")}
              </p>
            </div>
          </label>

          <label
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 transition-all shadow-xs",
              selectedCommune && !selectedCommune.has_stop_desk
                ? "opacity-50 cursor-not-allowed border-dashed bg-muted/40"
                : "cursor-pointer",
              value.deliveryType === "STOP_DESK"
                ? "border-[var(--primary)] bg-white ring-2 ring-[var(--primary)]/15 shadow-sm"
                : "border-border bg-white/60 hover:bg-white hover:border-[var(--primary)]/30"
            )}
          >
            <input
              type="radio"
              name="dtype"
              disabled={Boolean(selectedCommune && !selectedCommune.has_stop_desk)}
              checked={value.deliveryType === "STOP_DESK"}
              onChange={() => handleType("STOP_DESK")}
              className="mt-1 h-4 w-4 accent-[var(--primary)]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Building className="h-4 w-4 text-[var(--brand)] shrink-0" />
                <p className="text-sm font-semibold text-[var(--primary)]">{t("stopDesk")}</p>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Économique
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {selectedWilaya ? formatMoney(selectedWilaya.stopDeskFee) : t("stopDeskHint")}
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Wilaya */}
        <div>
          <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="d-wilaya">
            {t("yourWilaya")} *
          </label>
          <select id="d-wilaya" required value={value.wilayaId ?? ""} onChange={(e) => handleWilaya(e.target.value)} className={inputCls}>
            <option value="">{t("selectWilaya")}</option>
            {(wilayas || []).map((w) => (
              <option key={w.id} value={w.id}>
                {lang === "ar" ? `${w.id} — ${w.ar}` : `${w.id} — ${w.fr}`}
              </option>
            ))}
          </select>
        </div>

        {/* Commune */}
        <div>
          <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="d-commune">
            {t("yourCommune")} *
          </label>
          <div className="relative">
            <select
              id="d-commune"
              required
              disabled={!value.wilayaId || communesLoading}
              value={value.commune}
              onChange={(e) => handleCommune(e.target.value)}
              className={cn(inputCls, "disabled:bg-muted disabled:cursor-not-allowed")}
            >
              <option value="">{communesLoading ? t("loading") : t("selectCommune")}</option>
              {communes.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                  {c.has_stop_desk ? " ●" : ""}
                </option>
              ))}
            </select>
            {communesLoading && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </div>

      {/* Live fee status */}
      {value.wilayaId && (
        <>
          {(communesLoading || feeState === "loading") && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("feeCalculating")}
            </p>
          )}
          {communesError && (
            <div className="rounded-xl border border-border bg-muted/50 px-4 py-3.5 flex items-start gap-3">
              <Truck className="h-4 w-4 text-[var(--brand)] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-relaxed">{t("carrierDownText")}</p>
                <button
                  type="button"
                  onClick={retryWilayas}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  <RefreshCw className="h-3 w-3" /> {t("retry")}
                </button>
              </div>
            </div>
          )}
          {value.deliveryType === "STOP_DESK" && value.commune && selectedCommune && !selectedCommune.has_stop_desk && (
            <p className="text-xs text-muted-foreground">{t("noStopDesk")}</p>
          )}
          {value.commune && selectedWilaya && fee !== null && (
            <div className="flex items-center justify-between rounded-xl bg-[var(--primary)]/[0.04] border border-[var(--primary)]/10 px-4 py-3">
              <span className="text-sm text-[var(--primary)] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--brand)]" /> {t("deliveryFee")}
              </span>
              <span className="font-semibold text-[var(--primary)]">{formatMoney(fee)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
