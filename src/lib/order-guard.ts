import { db } from "@/lib/db";
import { normalizeDzPhone } from "@/lib/format";

/**
 * Order submission guard: blocked phones + in-memory rate limiting.
 * (Single-instance deployment — the limiter resets on restart, which is
 * acceptable for its purpose: slowing down spam, not criminal-grade blocking.)
 */

// ---- rate limiting (sliding window) ----

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((ts) => now - ts < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((ts) => now - ts > windowMs)) buckets.delete(k);
    }
  }
  return true;
}

export function phoneKey(phone: string): string {
  const p = normalizeDzPhone(phone);
  return p.length >= 9 ? p.slice(-9) : p;
}

// ---- blocked phones ----

/** Returns true if the phone is blocked by the admin (active row match on last 9 digits). */
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

/** True if this number had a previous REFUSED or RETURNED order (warning badge). */
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
