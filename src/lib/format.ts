import type { StoreSettings } from "@/lib/settings";

export function formatMoney(amount: number, settings?: Pick<StoreSettings, "currencySymbol">): string {
  const symbol = settings?.currencySymbol ?? "$";
  const fixed = Math.abs(amount) % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  return `${symbol}${fixed}`;
}

export function formatMoneyCode(amount: number, currencyCode = "USD"): string {
  const fixed = Math.abs(amount) % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  return `${fixed} ${currencyCode}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `LG-${code}`;
}

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-sky-100 text-sky-800 border-sky-200",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-blue-100 text-blue-800 border-blue-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
};

export interface MediaItem {
  type: "image" | "video";
  url: string;
  alt?: string;
}

export function parseMedia(json: string | null | undefined): MediaItem[] {
  try {
    const parsed = JSON.parse(json || "[]");
    if (Array.isArray(parsed)) return parsed as MediaItem[];
  } catch {
    // ignore
  }
  return [];
}
