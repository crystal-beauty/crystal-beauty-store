import { db } from "@/lib/db";
import { getSettings, type StoreSettings } from "@/lib/settings";

/**
 * World Express delivery client (EcoTrack platform tenant).
 *
 * ONLY the endpoints documented by the carrier are implemented:
 *   GET    /api/v1/get/fees
 *   GET    /api/v1/get/communes?wilaya_id=X
 *   POST   /api/v1/create/order?...      (all params as QUERY STRING, empty body)
 *   GET    /api/v1/get/orders?tracking=X
 *   DELETE /api/v1/delete/order?tracking=X
 *
 * Auth: `Authorization: Bearer <token>` header.
 * Token priority: dashboard setting (server-side only) → WORLDEXPRESS_API_TOKEN (.env).
 * Base URL priority: dashboard setting → WORLDEXPRESS_BASE_URL (.env) → primary,
 * with the documented fallback host tried automatically on network failure.
 *
 * NOTE: no price table is ever stored in the DB — fees/communes come live from
 * the API and are cached briefly (CarrierCache) for speed.
 */

export const DEFAULT_BASE = "https://world-express.ecotrack.dz";
export const FALLBACK_BASE = "https://mono2.ecotrack.dz";
const TIMEOUT_MS = 15000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h for lists (fees / communes)

export interface WilayaFee {
  wilaya_id: number;
  tarif: number; // home delivery, DZD
  tarif_stopdesk: number; // stop desk, DZD
}

export interface Commune {
  name: string; // exact carrier spelling — pass it back verbatim when ordering
  wilaya_id: number;
  code_postal: string;
  has_stop_desk: boolean;
}

// ---------- token / base urls ----------

export async function carrierConfig(settings?: StoreSettings) {
  const s = settings ?? (await getSettings());
  const token = s.carrierApiToken || process.env.WORLDEXPRESS_API_TOKEN || "";
  const bases = [s.carrierApiUrl || process.env.WORLDEXPRESS_BASE_URL || DEFAULT_BASE];
  for (const b of [DEFAULT_BASE, FALLBACK_BASE]) {
    if (!bases[0].includes(new URL(b).host) && b !== FALLBACK_BASE) bases.push(b);
  }
  if (!bases.includes(FALLBACK_BASE)) bases.push(FALLBACK_BASE);
  return { token, bases, enabled: s.carrierEnabled };
}

// ---------- cache ----------

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const row = await db.carrierCache.findUnique({ where: { key } });
    if (row && row.expiresAt > new Date()) return JSON.parse(row.payload) as T;
  } catch {
    // cache miss on any error
  }
  return null;
}

async function cacheSet(key: string, payload: unknown): Promise<void> {
  try {
    await db.carrierCache.upsert({
      where: { key },
      update: { payload: JSON.stringify(payload), expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
      create: { key, payload: JSON.stringify(payload), expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
    });
  } catch {
    // cache write failure is never fatal
  }
}

export async function clearCarrierCache(): Promise<void> {
  try {
    await db.carrierCache.deleteMany({});
  } catch {
    // ignore
  }
}

// ---------- low-level request (with fallback host) ----------

async function carrierFetch(
  path: string,
  init: { method?: "GET" | "POST" | "DELETE"; query?: Record<string, string | number | undefined> } = {},
  cfg?: { token: string; bases: string[] }
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const config = cfg ?? (await carrierConfig());
  if (!config.token) throw new Error("CARRIER_NO_TOKEN");

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(init.query || {})) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const fullPath = qs.toString() ? `${path}?${qs.toString()}` : path;

  let lastError: unknown = null;
  for (const base of config.bases) {
    try {
      const res = await fetch(`${base}${fullPath}`, {
        method: init.method || "GET",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/json",
          // NOTE: create/order takes NO body — documented carrier quirk.
        },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const text = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      // 404/405 on the primary host → try the fallback host
      if (!res.ok && (res.status === 404 || res.status === 405) && base !== config.bases[config.bases.length - 1]) {
        continue;
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      lastError = err;
      // network failure → try next host
    }
  }
  throw lastError ?? new Error("CARRIER_UNREACHABLE");
}

// ---------- Endpoint 1: fees ----------

export async function getFees(force = false, cfg?: { token: string; bases: string[] }): Promise<WilayaFee[]> {
  if (!force) {
    const cached = await cacheGet<WilayaFee[]>("fees");
    if (cached) return cached;
  }
  const res = await carrierFetch("/api/v1/get/fees", {}, cfg);
  if (!res.ok) throw new Error(`CARRIER_FEES_HTTP_${res.status}`);
  const raw = (res.data as { livraison?: { wilaya_id: number; tarif: string; tarif_stopdesk: string }[] })?.livraison;
  if (!Array.isArray(raw)) throw new Error("CARRIER_FEES_BAD_FORMAT");
  const fees: WilayaFee[] = raw.map((r) => ({
    wilaya_id: Number(r.wilaya_id),
    tarif: Math.round(parseFloat(r.tarif) || 0),
    tarif_stopdesk: Math.round(parseFloat(r.tarif_stopdesk) || 0),
  }));
  await cacheSet("fees", fees);
  return fees;
}

export async function getFeeForWilaya(wilayaId: number, type: "HOME" | "STOP_DESK"): Promise<number | null> {
  const fees = await getFees();
  const fee = fees.find((f) => f.wilaya_id === wilayaId);
  if (!fee) return null; // wilaya not served
  return type === "STOP_DESK" ? fee.tarif_stopdesk : fee.tarif;
}

// ---------- Endpoint 2: communes ----------

export async function getCommunes(wilayaId: number, force = false): Promise<Commune[]> {
  const key = `communes_${wilayaId}`;
  if (!force) {
    const cached = await cacheGet<Commune[]>(key);
    if (cached) return cached;
  }
  // Carrier quirk: the documented `code_wilaya` param is ignored — must use wilaya_id.
  const res = await carrierFetch("/api/v1/get/communes", { query: { wilaya_id: wilayaId } });
  if (!res.ok) throw new Error(`CARRIER_COMMUNES_HTTP_${res.status}`);
  const raw = res.data as { nom: string; wilaya_id: number; code_postal: string; has_stop_desk: number | boolean }[];
  if (!Array.isArray(raw)) throw new Error("CARRIER_COMMUNES_BAD_FORMAT");
  const communes: Commune[] = raw.map((c) => ({
    name: c.nom,
    wilaya_id: Number(c.wilaya_id),
    code_postal: String(c.code_postal ?? ""),
    has_stop_desk: c.has_stop_desk === 1 || c.has_stop_desk === true || c.has_stop_desk === "1",
  }));
  await cacheSet(key, communes);
  return communes;
}

// ---------- Endpoint 3: create parcel ----------

export interface CreateParcelInput {
  reference: string; // store order number (unique)
  customerName: string;
  phone: string; // Algerian local format 05/06/07…
  phone2?: string;
  address: string; // MAX 30 chars (waybill printer constraint — enforced by caller)
  wilayaCode: number; // 1..58
  commune: string; // exact name from getCommunes
  codAmount: number; // DZD — products + delivery fee
  deliveryType: "HOME" | "STOP_DESK";
  stopDeskName?: string;
  productsLabel: string; // short product description
  note?: string; // remarque for the delivery agent
  canOpen?: boolean;
}

export interface CreateParcelResult {
  tracking: string;
  reference: string;
  raw: unknown;
}

export async function createParcel(input: CreateParcelInput, cfg?: { token: string; bases: string[] }): Promise<CreateParcelResult> {
  if (input.address.length > 30) throw new Error("ADDRESS_TOO_LONG");
  const type = input.deliveryType === "STOP_DESK" ? 2 : 1;

  // Documented quirk: ALL parameters go in the query string with an empty body.
  const query: Record<string, string | number | undefined> = {
    nom_client: input.customerName,
    telephone: input.phone,
    telephone_2: input.phone2 || undefined,
    adresse: input.address,
    code_wilaya: input.wilayaCode,
    commune: input.commune,
    montant: Math.round(input.codAmount),
    type,
    stop_desk: type === 2 ? 1 : 0,
    produit: input.productsLabel,
    remarque: input.note || undefined,
    reference: input.reference,
    can_open: input.canOpen ? 1 : undefined,
  };

  const res = await carrierFetch("/api/v1/create/order", { method: "POST", query }, cfg);
  const data = res.data as { success?: boolean; tracking?: string; reference?: string; message?: string; raw?: unknown };

  if (!res.ok || !data?.success || !data?.tracking) {
    const msg =
      (data as { message?: string; errors?: Record<string, string[]> })?.message ||
      JSON.stringify((data as { errors?: Record<string, string[]> })?.errors || {}) ||
      `HTTP ${res.status}`;
    throw new Error(`CARRIER_CREATE_FAILED: ${msg}`);
  }
  return { tracking: data.tracking, reference: data.reference || input.reference, raw: data };
}

// ---------- Endpoint 4: tracking ----------

export interface CarrierTrackingInfo {
  tracking: string;
  reference: string;
  status: string; // raw carrier status
  global_status: string; // raw global status
  montant: number;
  tarif_prestation: number; // delivery fee charged by the carrier
  raw: unknown;
}

export async function getTracking(tracking: string, cfg?: { token: string; bases: string[] }): Promise<CarrierTrackingInfo | null> {
  const res = await carrierFetch("/api/v1/get/orders", { query: { tracking } }, cfg);
  if (!res.ok) throw new Error(`CARRIER_TRACKING_HTTP_${res.status}`);
  const list = (res.data as { data?: Record<string, unknown>[] })?.data;
  if (!Array.isArray(list) || list.length === 0) return null;
  const row = list[0];
  return {
    tracking: String(row.tracking ?? tracking),
    reference: String(row.reference ?? ""),
    status: String(row.status ?? ""),
    global_status: String(row.global_status ?? ""),
    montant: Number(row.montant ?? 0),
    tarif_prestation: Number(row.tarif_prestation ?? 0),
    raw: row,
  };
}

// ---------- Endpoint 5: cancel (DELETE — no POST /cancel documented) ----------

export async function deleteParcel(tracking: string, cfg?: { token: string; bases: string[] }): Promise<boolean> {
  const res = await carrierFetch("/api/v1/delete/order", { method: "DELETE", query: { tracking } }, cfg);
  const data = res.data as { delete?: string };
  return res.ok && data?.delete === "success";
}

// ---------- Status mapping (carrier → store) ----------
// Documented observed values: status "prete_a_expedier", global_status "en_process".
// The docs don't provide the full status list, so beyond the documented values we
// apply defensive keyword matching. Unknown statuses keep the current store status
// (raw value is always saved on the order for inspection).
// ⚠️ TO CONFIRM with the carrier — see the compatibility checklist.

export function mapCarrierStatus(status: string, globalStatus: string): "SENT_TO_CARRIER" | "IN_DELIVERY" | "DELIVERED" | "REFUSED" | "RETURNED" | "CANCELLED" | null {
  const s = `${status} ${globalStatus}`.toLowerCase();
  if (!s.trim()) return null;
  if (s.includes("annul") || s.includes("cancel") || s.includes("supprime")) return "CANCELLED";
  if (s.includes("refus") || s.includes("refused")) return "REFUSED";
  if (s.includes("retour") || s.includes("returned") || s.includes("renvoy")) return "RETURNED";
  if (s.includes("en_cours") || s.includes("in_delivery") || s.includes("sortie") || s.includes("avec_livreur")) return "IN_DELIVERY";
  if (s.includes("livr") && !s.includes("en_cours")) return "DELIVERED";
  if (s.includes("prete") || s.includes("exped") || s.includes("en_process") || s.includes("nouvelle") || s.includes("recu")) return "SENT_TO_CARRIER";
  return null;
}
