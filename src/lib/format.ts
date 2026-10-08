import type { StoreSettings } from "@/lib/settings";

// ---------- Money (DZD, whole numbers, e.g. "7 490 DA") ----------

export function formatMoney(amount: number, _settings?: unknown): string {
  const whole = Math.round(Number.isFinite(amount) ? amount : 0);
  const withSpaces = String(Math.abs(whole)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${whole < 0 ? "-" : ""}${withSpaces} DA`;
}

// kept for compatibility with older imports — same output in DZD
export function formatMoneyCode(amount: number): string {
  return formatMoney(amount);
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

// ---------- Order statuses (COD pipeline) ----------

export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "SENT_TO_CARRIER",
  "IN_DELIVERY",
  "DELIVERED",
  "REFUSED",
  "RETURNED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  SENT_TO_CARRIER: "Sent to carrier",
  IN_DELIVERY: "In delivery",
  DELIVERED: "Delivered",
  REFUSED: "Refused",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
};

export const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-sky-100 text-sky-800 border-sky-200",
  SENT_TO_CARRIER: "bg-indigo-100 text-indigo-800 border-indigo-200",
  IN_DELIVERY: "bg-blue-100 text-blue-800 border-blue-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REFUSED: "bg-orange-100 text-orange-800 border-orange-200",
  RETURNED: "bg-purple-100 text-purple-800 border-purple-200",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
};

// ---------- Wilayas (official 58 codes, FR + AR names) ----------
// The carrier serves 57 of them; id 50 is currently unserved (excluded
// automatically because checkout only offers wilayas present in the live fees).

export const WILAYAS: { id: number; fr: string; ar: string }[] = [
  { id: 1, fr: "Adrar", ar: "أدرار" },
  { id: 2, fr: "Chlef", ar: "الشلف" },
  { id: 3, fr: "Laghouat", ar: "الأغواط" },
  { id: 4, fr: "Oum El Bouaghi", ar: "أم البواقي" },
  { id: 5, fr: "Batna", ar: "باتنة" },
  { id: 6, fr: "Béjaïa", ar: "بجاية" },
  { id: 7, fr: "Biskra", ar: "بسكرة" },
  { id: 8, fr: "Béchar", ar: "بشار" },
  { id: 9, fr: "Blida", ar: "البليدة" },
  { id: 10, fr: "Bouira", ar: "البويرة" },
  { id: 11, fr: "Tamanrasset", ar: "تمنراست" },
  { id: 12, fr: "Tébessa", ar: "تبسة" },
  { id: 13, fr: "Tlemcen", ar: "تلمسان" },
  { id: 14, fr: "Tiaret", ar: "تيارت" },
  { id: 15, fr: "Tizi Ouzou", ar: "تيزي وزو" },
  { id: 16, fr: "Alger", ar: "الجزائر" },
  { id: 17, fr: "Djelfa", ar: "الجلفة" },
  { id: 18, fr: "Jijel", ar: "جيجل" },
  { id: 19, fr: "Sétif", ar: "سطيف" },
  { id: 20, fr: "Saïda", ar: "سعيدة" },
  { id: 21, fr: "Skikda", ar: "سكيكدة" },
  { id: 22, fr: "Sidi Bel Abbès", ar: "سيدي بلعباس" },
  { id: 23, fr: "Annaba", ar: "عنابة" },
  { id: 24, fr: "Guelma", ar: "قالمة" },
  { id: 25, fr: "Constantine", ar: "قسنطينة" },
  { id: 26, fr: "Médéa", ar: "المدية" },
  { id: 27, fr: "Mostaganem", ar: "مستغانم" },
  { id: 28, fr: "M'Sila", ar: "المسيلة" },
  { id: 29, fr: "Mascara", ar: "معسكر" },
  { id: 30, fr: "Ouargla", ar: "ورقلة" },
  { id: 31, fr: "Oran", ar: "وهران" },
  { id: 32, fr: "El Bayadh", ar: "البيض" },
  { id: 33, fr: "Illizi", ar: "إليزي" },
  { id: 34, fr: "Bordj Bou Arreridj", ar: "برج بوعريريج" },
  { id: 35, fr: "Boumerdès", ar: "بومرداس" },
  { id: 36, fr: "El Tarf", ar: "الطارف" },
  { id: 37, fr: "Tindouf", ar: "تندوف" },
  { id: 38, fr: "Tissemsilt", ar: "تيسمسيلت" },
  { id: 39, fr: "El Oued", ar: "الوادي" },
  { id: 40, fr: "Khenchela", ar: "خنشلة" },
  { id: 41, fr: "Souk Ahras", ar: "سوق أهراس" },
  { id: 42, fr: "Tipaza", ar: "تيبازة" },
  { id: 43, fr: "Mila", ar: "ميلة" },
  { id: 44, fr: "Aïn Defla", ar: "عين الدفلى" },
  { id: 45, fr: "Naâma", ar: "النعامة" },
  { id: 46, fr: "Aïn Témouchent", ar: "عين تموشنت" },
  { id: 47, fr: "Ghardaïa", ar: "غرداية" },
  { id: 48, fr: "Relizane", ar: "غليزان" },
  { id: 49, fr: "Timimoun", ar: "تيميمون" },
  { id: 50, fr: "Bordj Badji Mokhtar", ar: "برج باجي مختار" },
  { id: 51, fr: "Ouled Djellal", ar: "أولاد جلال" },
  { id: 52, fr: "Béni Abbès", ar: "بني عباس" },
  { id: 53, fr: "In Salah", ar: "عين صالح" },
  { id: 54, fr: "In Guezzam", ar: "عين قزام" },
  { id: 55, fr: "Touggourt", ar: "تقرت" },
  { id: 56, fr: "Djanet", ar: "جانت" },
  { id: 57, fr: "El M'Ghair", ar: "المغير" },
  { id: 58, fr: "El Meniaa", ar: "المنيعة" },
];

export function wilayaName(id: number | null | undefined, lang: "fr" | "ar" = "fr"): string {
  const w = WILAYAS.find((x) => x.id === id);
  if (!w) return "";
  return lang === "ar" ? w.ar : w.fr;
}

// ---------- Algerian phone helpers ----------

/** Normalize an Algerian mobile to local format 0XXXXXXXXX (10 digits). */
export function normalizeDzPhone(raw: string): string {
  let digits = (raw || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+213")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("00213")) digits = "0" + digits.slice(5);
  else if (digits.startsWith("213") && digits.length === 12) digits = "0" + digits.slice(3);
  return digits.replace(/\D/g, "");
}

/** Valid Algerian mobile: 05/06/07 + 8 digits. */
export function isValidDzMobile(raw: string): boolean {
  const p = normalizeDzPhone(raw);
  return /^0(5|6|7)\d{8}$/.test(p);
}

/** Convert an Algerian number to international +213 format for WhatsApp links. */
export function toInternationalDz(raw: string): string {
  const p = normalizeDzPhone(raw);
  if (p.startsWith("0") && p.length === 10) return "+213" + p.slice(1);
  return raw.startsWith("+") ? raw : `+${p}`;
}

// ---------- Media ----------

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
