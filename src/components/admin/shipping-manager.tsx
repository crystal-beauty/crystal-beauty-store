"use client";

import { useCallback, useEffect, useState } from "react";
import { Truck, Loader2, RefreshCw, Trash2, CheckCircle2, XCircle, TestTube2, Wifi, WifiOff } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

interface CarrierStatus {
  connected: boolean;
  enabled: boolean;
  baseUrl: string;
  fallbackUrl: string;
  tokenSource: string;
  primaryHost: string;
  wilayaCount?: number;
  samples?: { wilaya_id: number; tarif: number; tarif_stopdesk: number }[];
  error?: string;
  lastSync: string | null;
}

/**
 * Carrier connection page. Delivery prices are NOT editable here — they come
 * live from the carrier API. This page shows the connection state and lets
 * the admin test it / clear the cache / sync order statuses.
 */
export default function ShippingManager() {
  const [status, setStatus] = useState<CarrierStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/carrier");
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error("Impossible de vérifier la connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action: string) {
    setBusy(action);
    try {
      const res = await fetch("/api/admin/carrier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (action === "test") {
        if (data.ok) toast.success(data.message, { duration: 8000 });
        else toast.error(data.message || "Test échoué.", { duration: 8000 });
      } else if (action === "clear-cache") {
        toast.success(data.message);
      } else if (action === "sync") {
        toast.success(`${data.checked} colis vérifiés — ${data.updated.length} mise(s) à jour.`, { duration: 6000 });
        data.errors?.forEach((e: string) => toast.error(e, { duration: 6000 }));
      }
      await load();
    } catch {
      toast.error("Action impossible.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--primary)]">Livraison — World Express</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Les tarifs, wilayas, communes et arrêts bureau viennent en direct de l&apos;API du transporteur. Aucun prix n&apos;est saisi manuellement.
      </p>

      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-luxe">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      ) : status ? (
        <div className="space-y-5">
          {/* Connection card */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {status.connected ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> : <XCircle className="h-8 w-8 text-rose-500" />}
                <div>
                  <p className="font-semibold text-[var(--primary)] flex items-center gap-2">
                    {status.connected ? "Connecté" : "Déconnecté"}
                    {status.connected ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-rose-500" />}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                    {status.baseUrl}
                    <span className="mx-1">→ fallback:</span>
                    {status.fallbackUrl}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => act("test")} disabled={Boolean(busy)} className="inline-flex items-center gap-2 border border-border text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-muted disabled:opacity-50">
                  {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />} Tester la connexion
                </button>
                <button onClick={() => act("clear-cache")} disabled={Boolean(busy)} className="inline-flex items-center gap-2 border border-border text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-muted disabled:opacity-50">
                  {busy === "clear-cache" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Vider le cache
                </button>
                <button onClick={() => act("sync")} disabled={Boolean(busy)} className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 disabled:opacity-50">
                  {busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Synchroniser les statuts
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-5 text-sm">
              <div className="rounded-xl bg-muted px-4 py-3">
                <p className="text-muted-foreground text-xs">Jeton API</p>
                <p className="font-medium mt-0.5">{status.tokenSource === "env" ? "Depuis .env (recommandé)" : status.tokenSource === "dashboard" ? "Depuis les paramètres" : "MANQUANT"}</p>
              </div>
              <div className="rounded-xl bg-muted px-4 py-3">
                <p className="text-muted-foreground text-xs">Wilayas desservies</p>
                <p className="font-medium mt-0.5">{status.wilayaCount ?? "—"} / 58</p>
              </div>
              <div className="rounded-xl bg-muted px-4 py-3">
                <p className="text-muted-foreground text-xs">Cache frais (expire)</p>
                <p className="font-medium mt-0.5">{status.lastSync ? new Date(status.lastSync).toLocaleString("fr-FR") : "—"}</p>
              </div>
            </div>

            {status.error && <p className="mt-4 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">{status.error}</p>}
            <p className="mt-4 text-xs text-muted-foreground">
              Pour changer le jeton API : modifiez <code className="font-mono bg-muted px-1.5 py-0.5 rounded">WORLDEXPRESS_API_TOKEN</code> dans le fichier{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">.env</code> côté serveur (il n&apos;est jamais affiché ici).
            </p>
          </div>

          {/* Sample live fees */}
          {status.samples && status.samples.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
              <h2 className="font-semibold text-[var(--primary)] flex items-center gap-2 mb-4">
                <Truck className="h-4.5 w-4.5 text-[var(--gold)]" /> Tarifs en direct (échantillon)
              </h2>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                {status.samples.map((s) => (
                  <div key={s.wilaya_id} className="rounded-xl border border-border px-4 py-3">
                    <p className="font-medium text-[var(--primary)]">Wilaya {s.wilaya_id}</p>
                    <p className="text-muted-foreground mt-1">Domicile : <span className="font-semibold text-foreground">{formatMoney(s.tarif)}</span></p>
                    <p className="text-muted-foreground">Stop desk : <span className="font-semibold text-foreground">{formatMoney(s.tarif_stopdesk)}</span></p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Extrait réel de GET /api/v1/get/fees — vérifiable sur le portail du transporteur.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
