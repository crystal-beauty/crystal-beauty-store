import { db } from "@/lib/db";
import { normalizeDzPhone } from "@/lib/format";

/**
 * ── Crystal Beauty Anti-bot & Anti-fraud Order Guard ─────────────────────────────
 * Layered protection on order creation flow and admin login.
 * Conforms to Algerian E-commerce (Loi 18-05) and Personal Data (Loi 18-07 ANPDP) rules.
 *
 * Layers:
 *   1. Honeypot ("website") — must stay empty; real users never see it, bots fill it.
 *   2. Form timing — orders completed in < 2500ms are scripted bots.
 *   3. Field sanity — Algerian mobile (05/06/07), dummy sequence rejection, clean name/address.
 *   4. DB-backed rate limits & velocity protection:
 *        · velocity: min 90s interval between orders from same phone
 *        · max 3 orders per phone per 24h
 *        · max 8 orders per IP per hour
 *   5. Admin login brute-force guard (10 tries / 15 min / IP).
 *   6. Phone blacklist (db.blockedPhone).
 */

export const MIN_FILL_MS = 2500;
export const MAX_QTY_PER_PRODUCT = 10;
export const MAX_TOTAL_ITEMS = 20;
export const MAX_NOTE_LEN = 500;
export const MAX_NAME_LEN = 60;
export const MAX_ADDRESS_LEN = 100;

export type GuardResult = { ok: true } | { ok: false; error: string; code: string };

const genericBuckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (genericBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
  if (hits.length >= max) {
    genericBuckets.set(key, hits);
    return false;
  }
  hits.push(now);
  genericBuckets.set(key, hits);
  if (genericBuckets.size > 5000) {
    for (const [k, v] of genericBuckets) {
      if (v.every((ts) => now - ts > windowMs)) genericBuckets.delete(k);
    }
  }
  return true;
}

/** 1 — Honeypot: real users never fill this hidden field. */
export function checkHoneypot(v: unknown): GuardResult {
  if (typeof v === "string" && v.trim() !== "") {
    return { ok: false, error: "Tentative de soumission automatisée bloquée.", code: "BOT_SUSPECTED" };
  }
  return { ok: true };
}

/** 2 — Timing: form submitted too quickly = bot. */
export function checkFillTime(startedAt: unknown): GuardResult {
  const t = Number(startedAt);
  if (!Number.isFinite(t) || t <= 0) {
    return { ok: true }; // graceful fallback if client clock missing
  }
  const elapsed = Date.now() - t;
  // Clock skew tolerance: allow if at least 1.5s
  if (elapsed < 1500) {
    return { ok: false, error: "Veuillez patienter quelques secondes avant de valider votre commande.", code: "TOO_FAST" };
  }
  return { ok: true };
}

/** 3a — Name: letters (including French & Arabic), spaces, ' - . no links or spam blobs. */
export function checkName(name: string): GuardResult {
  const clean = name.trim();
  if (clean.length < 3 || clean.length > MAX_NAME_LEN) {
    return { ok: false, error: "Veuillez indiquer un nom valide (au moins 3 caractères).", code: "INVALID_NAME" };
  }
  if (/https?:|www\.|\.com|\.dz|@/i.test(clean)) {
    return { ok: false, error: "Le nom ne doit pas contenir de lien ou d'adresse internet.", code: "INVALID_NAME" };
  }
  if (/\d{3,}/.test(clean)) {
    return { ok: false, error: "Le nom ne doit pas contenir de série de chiffres.", code: "INVALID_NAME" };
  }
  // Block common spam / gibberish dummy names
  if (/^(test|testing|asdf|qwerty|azerty|fake|dummy|aaaa+|zzzz+|xxxx+)$/i.test(clean)) {
    return { ok: false, error: "Nom invalide. Veuillez renseigner votre véritable identité.", code: "INVALID_NAME" };
  }
  return { ok: true };
}

/** 3b — Strict Algerian mobile (05/06/07 + 8 digits) with dummy pattern rejection. */
export function checkPhoneSanity(phone: string): GuardResult {
  const digits = phone.replace(/\D/g, "");
  if (!/^0(5|6|7)[0-9]{8}$/.test(digits)) {
    return { ok: false, error: "Numéro invalide — utilisez un mobile algérien (05, 06 ou 07 - 10 chiffres).", code: "INVALID_PHONE" };
  }
  // Block all identical repeated digits e.g. 0555555555, 0666666666, 0700000000
  if (/^0(5|6|7)(\d)\2{7}$/.test(digits)) {
    return { ok: false, error: "Numéro de téléphone fictif ou invalide.", code: "DUMMY_PHONE" };
  }
  // Block obvious dummy sequences
  const dummies = [
    "0512345678", "0612345678", "0712345678",
    "0598765432", "0698765432", "0798765432",
    "0501234567", "0601234567", "0701234567",
    "0500000000", "0600000000", "0700000000",
  ];
  if (dummies.includes(digits)) {
    return { ok: false, error: "Numéro de téléphone fictif ou invalide.", code: "DUMMY_PHONE" };
  }
  return { ok: true };
}

/* ── 4 — DB-backed velocity & rate limits ───────────── */

export const PHONE_MAX_PER_24H = 3;
export const IP_MAX_PER_HOUR = 8;
export const VELOCITY_MIN_INTERVAL_MS = 90_000; // 90 seconds between orders from same phone

export async function checkOrderRate(phone: string, ip: string): Promise<GuardResult> {
  const now = Date.now();
  const normPhone = normalizeDzPhone(phone);

  try {
    // 4a — Anti-double-submit / rapid spam (same phone within 90s)
    const recentVelocity = await db.order.count({
      where: {
        phone: { contains: normPhone.slice(-8) },
        createdAt: { gte: new Date(now - VELOCITY_MIN_INTERVAL_MS) },
      },
    });
    if (recentVelocity > 0) {
      return {
        ok: false,
        error: "Une commande récente a déjà été enregistrée pour ce numéro. Patientez quelques instants ou contactez-nous sur WhatsApp.",
        code: "RATE_VELOCITY",
      };
    }

    // 4b — Daily volume cap per phone (max 3 in 24h)
    const byPhone = await db.order.count({
      where: {
        phone: { contains: normPhone.slice(-8) },
        createdAt: { gte: new Date(now - 24 * 3600_000) },
      },
    });
    if (byPhone >= PHONE_MAX_PER_24H) {
      return {
        ok: false,
        error: "Limite quotidienne de commandes atteinte pour ce numéro. Contactez notre service client sur WhatsApp pour ajouter des articles.",
        code: "RATE_PHONE",
      };
    }

    // 4c — IP flood protection (max 8 per hour)
    if (ip && ip !== "unknown" && ip !== "127.0.0.1") {
      const byIp = await db.order.count({
        where: {
          customerIp: ip,
          createdAt: { gte: new Date(now - 3600_000) },
        },
      });
      if (byIp >= IP_MAX_PER_HOUR) {
        return {
          ok: false,
          error: "Trop de commandes enregistrées depuis cette connexion. Veuillez réessayer plus tard.",
          code: "RATE_IP",
        };
      }
    }
  } catch (e) {
    console.error("Order rate check failed silently:", e);
  }

  return { ok: true };
}

/* ── 5 — Brute-force guard for the admin login ────────── */

type Bucket = { hits: number[]; blockedUntil: number };
const loginBuckets = new Map<string, Bucket>();
const LOGIN_MAX_TRIES = 10;
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_BLOCK_MS = 15 * 60_000;

export function loginAllowed(ip: string): boolean {
  const b = loginBuckets.get(ip);
  if (!b) return true;
  if (b.blockedUntil > Date.now()) return false;
  return true;
}

export function loginFailure(ip: string): boolean {
  const now = Date.now();
  const b = loginBuckets.get(ip) ?? { hits: [], blockedUntil: 0 };
  b.hits = b.hits.filter((t) => now - t < LOGIN_WINDOW_MS);
  b.hits.push(now);
  if (b.hits.length >= LOGIN_MAX_TRIES) {
    b.blockedUntil = now + LOGIN_BLOCK_MS;
    b.hits = [];
  }
  loginBuckets.set(ip, b);
  return b.blockedUntil > now;
}

export function loginSuccess(ip: string): void {
  loginBuckets.delete(ip);
}

/* ── 6 — Blacklisted phone check ────────── */

export function phoneKey(phone: string): string {
  const p = normalizeDzPhone(phone);
  return p.length >= 9 ? p.slice(-9) : p;
}

export async function isPhoneBlocked(phone: string): Promise<boolean> {
  try {
    const key = phoneKey(phone);
    if (!key) return false;
    const blocked = await db.blockedPhone.findMany({ where: { active: true } });
    return blocked.some((b) => phoneKey(b.phone) === key);
  } catch {
    return false;
  }
}

export async function phoneHasRefusals(phone: string): Promise<boolean> {
  try {
    const key = phoneKey(phone);
    if (!key) return false;
    const orders = await db.order.findMany({
      where: { status: { in: ["REFUSED", "RETURNED"] } },
      select: { phone: true },
    });
    return orders.some((o) => phoneKey(o.phone) === key);
  } catch {
    return false;
  }
}

/** Extract client IP from request headers */
export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 45);
  return h.get("x-real-ip")?.slice(0, 45) || "unknown";
}
