"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Save, Loader2, Trash2, CheckCircle2, XCircle, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PixelEventRow {
  id: string;
  eventName: string;
  eventId: string | null;
  payload: string | null;
  source: string;
  forwarded: boolean;
  createdAt: string;
}

export default function PixelCenter({
  initial,
}: {
  initial: {
    metaPixelEnabled: boolean;
    metaPixelId: string;
    metaCapiToken: string;
    metaTestEventCode: string;
    metaAdvancedMatching: boolean;
  };
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<PixelEventRow[]>([]);
  const [counts, setCounts] = useState<{ eventName: string; count: number }[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [clearOpen, setClearOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch("/api/admin/pixel-events");
      const data = await res.json();
      setEvents(data.events || []);
      setCounts(data.counts || []);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) return toast.error("Could not save pixel settings");
      toast.success("Meta Pixel settings saved — events will flow on the storefront");
    } finally {
      setSaving(false);
    }
  }

  async function clearEvents() {
    await fetch("/api/admin/pixel-events", { method: "DELETE" });
    toast.success("Event log cleared");
    setClearOpen(false);
    loadEvents();
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";

  const capiActive = Boolean(form.metaCapiToken && form.metaPixelId && form.metaPixelEnabled);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Meta Pixel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A complete tracking structure: browser pixel + server-side Conversions API with event deduplication.
        </p>
      </div>

      {/* Event pipeline diagram */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-luxe">
          <Zap className="h-5 w-5 text-[var(--brand)] mb-2" />
          <p className="text-sm font-semibold text-[var(--primary)]">1 · Browser Pixel</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Search fire automatically.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-luxe">
          <ShieldCheck className="h-5 w-5 text-[var(--brand)] mb-2" />
          <p className="text-sm font-semibold text-[var(--primary)]">2 · Server CAPI Relay</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Every event is mirrored to Meta&apos;s Conversions API with hashed customer data (iOS-proof).
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-luxe">
          <Activity className="h-5 w-5 text-[var(--brand)] mb-2" />
          <p className="text-sm font-semibold text-[var(--primary)]">3 · Event Dedup</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Shared <code className="text-[10px]">event_id</code> between browser & server so Meta counts each event once.
          </p>
        </div>
      </div>

      {/* Settings */}
      <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
        <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5">Configuration</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2.5 text-sm text-[var(--primary)]">
            <input
              type="checkbox"
              checked={form.metaPixelEnabled}
              onChange={(e) => setForm({ ...form, metaPixelEnabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Meta Pixel enabled on the storefront
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Pixel ID *</label>
              <input value={form.metaPixelId} onChange={(e) => setForm({ ...form, metaPixelId: e.target.value })} className={inputCls} placeholder="1234567890123456" />
            </div>
            <div>
              <label className={labelCls}>Test Event Code (optional)</label>
              <input value={form.metaTestEventCode} onChange={(e) => setForm({ ...form, metaTestEventCode: e.target.value })} className={inputCls} placeholder="TEST12345" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Conversions API Token (for server-side tracking)</label>
            <input
              type="password"
              value={form.metaCapiToken}
              onChange={(e) => setForm({ ...form, metaCapiToken: e.target.value })}
              className={inputCls}
              placeholder="Generate in Meta Events Manager → Settings → Conversions API"
            />
            <p className={cn("text-xs mt-2 flex items-center gap-1.5", capiActive ? "text-[var(--primary)]" : "text-muted-foreground")}>
              {capiActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {capiActive
                ? "Server-side Conversions API is active — events are sent from your server with deduplication."
                : "Add a CAPI token to enable iOS-protected, server-side event delivery."}
            </p>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-[var(--primary)]">
            <input
              type="checkbox"
              checked={form.metaAdvancedMatching}
              onChange={(e) => setForm({ ...form, metaAdvancedMatching: e.target.checked })}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Advanced Matching (hash customer email/phone automatically)
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[var(--brand)] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#16305c] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Pixel Settings
          </button>
        </div>
      </section>

      {/* Events feed */}
      <section className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--primary)]">Event Log</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Last 200 events captured by the store.</p>
          </div>
          <button
            onClick={() => setClearOpen(true)}
            className="inline-flex items-center gap-2 border border-destructive/30 text-destructive text-sm font-medium px-4 py-2 rounded-xl hover:bg-destructive/5"
          >
            <Trash2 className="h-4 w-4" /> Clear Log
          </button>
        </div>

        {/* Counts */}
        {counts.length > 0 && (
          <div className="flex gap-2 px-5 py-3 border-b border-border overflow-x-auto no-scrollbar">
            {counts.map((c) => (
              <span key={c.eventName} className="shrink-0 bg-muted text-[var(--primary)] text-xs font-medium px-3 py-1.5 rounded-full">
                {c.eventName}: <strong>{c.count}</strong>
              </span>
            ))}
          </div>
        )}

        {loadingEvents ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events captured yet. Visit the storefront to generate some.</p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin divide-y divide-border">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="bg-[var(--primary)]/5 text-[var(--primary)] text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0">
                  {ev.eventName}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(ev.createdAt).toLocaleTimeString()}</span>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                    ev.source === "server" ? "bg-[var(--brand)]/10 text-[var(--brand)]" : "bg-muted text-muted-foreground"
                  )}
                >
                  {ev.source === "server" ? "SERVER CAPI" : "BROWSER"}
                </span>
                {ev.source === "server" && (
                  <span className="flex items-center gap-1 text-[10px] shrink-0" title={ev.forwarded ? "Forwarded to Meta" : "Not forwarded (no CAPI token)"}>
                    {ev.forwarded ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                  </span>
                )}
                <span className="text-xs text-muted-foreground/60 truncate font-mono">{ev.eventId}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the event log?</AlertDialogTitle>
            <AlertDialogDescription>All logged pixel events will be deleted. Your Meta Pixel settings are untouched.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); clearEvents(); }} className="bg-destructive text-white hover:bg-destructive/90">
              Clear Log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
