import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { carrierConfig, getFees, getCommunes, clearCarrierCache, getTracking, mapCarrierStatus, DEFAULT_BASE, FALLBACK_BASE } from "@/lib/carrier";
import { ORDER_STATUSES } from "@/lib/format";

/**
 * GET /api/admin/carrier — connection status + live sample fees (3 wilayas)
 * POST /api/admin/carrier — { action: "test" | "clear-cache" | "sync" }
 */
export async function GET() {
  const guard = await requireApiSession("shipping");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const settings = await getSettingsForCarrier();
  const cfg = await carrierConfig(settings);
  const tokenFrom = settings.carrierApiToken ? "dashboard" : process.env.WORLDEXPRESS_API_TOKEN ? "env" : "missing";

  // live probe: fetch fees and report
  try {
    const fees = await getFees(false, cfg);
    const samples = [16, 31, 1].map((id) => fees.find((f) => f.wilaya_id === id)).filter(Boolean);
    return NextResponse.json({
      connected: true,
      enabled: cfg.enabled,
      baseUrl: cfg.bases[0],
      fallbackUrl: cfg.bases[1] || FALLBACK_BASE,
      tokenSource: tokenFrom,
      primaryHost: new URL(DEFAULT_BASE).host,
      wilayaCount: fees.length,
      samples,
      lastSync: await lastSync(),
    });
  } catch (e) {
    return NextResponse.json({
      connected: false,
      enabled: cfg.enabled,
      baseUrl: cfg.bases[0],
      fallbackUrl: cfg.bases[1] || FALLBACK_BASE,
      tokenSource: tokenFrom,
      primaryHost: new URL(DEFAULT_BASE).host,
      error: e instanceof Error ? e.message : "Unknown error",
      lastSync: await lastSync(),
    });
  }
}

async function getSettingsForCarrier() {
  const { getSettings } = await import("@/lib/settings");
  return getSettings();
}

async function lastSync(): Promise<string | null> {
  const row = await db.carrierCache.findUnique({ where: { key: "fees" } });
  return row ? row.expiresAt.toISOString() : null;
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession("shipping");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { action } = (await req.json()) as { action?: string };

  if (action === "clear-cache") {
    await clearCarrierCache();
    return NextResponse.json({ ok: true, message: "Cache cleared — next request fetches fresh data from the carrier." });
  }

  if (action === "test") {
    const settings = await getSettingsForCarrier();
    const cfg = await carrierConfig(settings);
    try {
      const fees = await getFees(true, cfg); // force = bypass cache
      const communes = await getCommunes(16, true);
      return NextResponse.json({
        ok: true,
        message: `Connection OK — ${fees.length} wilayas priced, ${communes.length} communes for Alger (16).`,
        wilayaCount: fees.length,
      });
    } catch (e) {
      return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Connection failed" }, { status: 502 });
    }
  }

  if (action === "sync") {
    // Poll the carrier for every order that has a tracking number
    const orders = await db.order.findMany({
      where: { trackingNumber: { not: null }, status: { in: ["SENT_TO_CARRIER", "IN_DELIVERY"] } },
      select: { id: true, orderNumber: true, trackingNumber: true, status: true, statusHistory: true },
    });
    const updated: string[] = [];
    const errors: string[] = [];
    for (const o of orders) {
      try {
        const info = await getTracking(o.trackingNumber!);
        if (!info) continue;
        const mapped = mapCarrierStatus(info.status, info.global_status);
        if (mapped && mapped !== o.status && ORDER_STATUSES.includes(mapped as (typeof ORDER_STATUSES)[number])) {
          const history = JSON.parse(o.statusHistory || "[]");
          history.push({ status: mapped, at: new Date().toISOString(), by: "carrier_sync" });
          await db.order.update({
            where: { id: o.id },
            data: {
              status: mapped,
              carrierStatus: info.status,
              globalStatus: info.global_status,
              statusHistory: JSON.stringify(history),
              deliveredAt: mapped === "DELIVERED" ? new Date() : undefined,
            },
          });
          updated.push(`${o.orderNumber} → ${mapped}`);
        }
      } catch (e) {
        errors.push(`${o.orderNumber}: ${e instanceof Error ? e.message : "error"}`);
      }
    }
    return NextResponse.json({ ok: true, checked: orders.length, updated, errors });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
