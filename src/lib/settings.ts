import { db } from "@/lib/db";

export interface StoreSettings {
  // General
  storeName: string;
  tagline: string;
  logoUrl: string;
  // Appearance
  primaryColor: string; // dark blue
  accentColor: string; // brand accent — navy/black/white charter only
  // Announcement
  announcementEnabled: boolean;
  announcementText: string; // FR
  announcementTextAr: string; // AR
  announcementLink: string;
  // Hero
  heroTitle: string;
  heroSubtitle: string;
  heroTitleAr: string;
  heroSubtitleAr: string;
  heroImage: string;
  heroCtaText: string;
  heroCtaLink: string;
  // Currency (DZD — whole numbers)
  currencyCode: string;
  currencySymbol: string;
  // Gift box (optional add-on — gifts are single-piece by default)
  giftBoxEnabled: boolean;
  giftBoxFee: number;
  giftBoxLabel: string;
  giftBoxLabelAr: string;
  giftBoxDescription: string;
  giftBoxDescriptionAr: string;
  // Contact (all optional — hidden when empty)
  contactPhone: string;
  whatsappNumber: string; // used for WhatsApp buttons (05/06/07 or +213…)
  contactEmail: string;
  contactAddress: string;
  contactHours: string;
  // Social (hidden when empty)
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  // Footer
  footerAbout: string;
  footerText: string;
  // Policy pages (FR + AR)
  policyDelivery: string;
  policyDeliveryAr: string;
  policyReturns: string;
  policyReturnsAr: string;
  policyPrivacy: string;
  policyPrivacyAr: string;
  // Carrier (World Express via EcoTrack) — token is server-side only,
  // never sent to the browser
  carrierEnabled: boolean;
  carrierApiUrl: string; // base URL, e.g. https://world-express.ecotrack.dz
  carrierApiToken: string; // empty → uses WORLDEXPRESS_API_TOKEN from .env
  canOpenParcel: boolean; // allow customer to open parcel before payment
  // Meta Pixel
  metaPixelEnabled: boolean;
  metaPixelId: string;
  metaCapiToken: string;
  metaTestEventCode: string;
  metaAdvancedMatching: boolean;
  // SEO
  seoTitle: string;
  seoDescription: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Lumina Gifts",
  tagline: "",
  logoUrl: "",
  primaryColor: "#0A1F44",
  accentColor: "#0A1F44",
  announcementEnabled: false,
  announcementText: "",
  announcementTextAr: "",
  announcementLink: "/products",
  heroTitle: "",
  heroSubtitle: "",
  heroTitleAr: "",
  heroSubtitleAr: "",
  heroImage: "",
  heroCtaText: "", // empty → storefront falls back to the bilingual i18n CTA
  heroCtaLink: "/products",
  currencyCode: "DZD",
  currencySymbol: "DA",
  giftBoxEnabled: true,
  giftBoxFee: 500,
  giftBoxLabel: "Ajouter une boîte cadeau élégante",
  giftBoxLabelAr: "أضف علبة هدايا أنيقة",
  giftBoxDescription:
    "Les cadeaux sont livrés à la pièce, sans emballage. Ajoutez une boîte cadeau uniquement si vous le souhaitez.",
  giftBoxDescriptionAr:
    "تُسلَّم الهدية كقطعة واحدة افتراضيًا. أضف علبة هدايا فقط إذا رغبت في ذلك.",
  contactPhone: "",
  whatsappNumber: "",
  contactEmail: "",
  contactAddress: "",
  contactHours: "",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  footerAbout: "",
  footerText: "© {year} {store}. Tous droits réservés.",
  policyDelivery: "",
  policyDeliveryAr: "",
  policyReturns: "",
  policyReturnsAr: "",
  policyPrivacy: "",
  policyPrivacyAr: "",
  carrierEnabled: true,
  carrierApiUrl: "",
  carrierApiToken: "",
  canOpenParcel: false,
  metaPixelEnabled: false,
  metaPixelId: "",
  metaCapiToken: "",
  metaTestEventCode: "",
  metaAdvancedMatching: true,
  seoTitle: "",
  seoDescription: "",
};

// Keys that must NEVER leave the server (admin API strips them from responses)
export const SECRET_SETTING_KEYS = ["carrierApiToken", "metaCapiToken"];

type SettingsMap = Partial<Record<keyof StoreSettings, string | number | boolean>>;

function coerce(key: keyof StoreSettings, raw: string): string | number | boolean {
  const defaultVal = DEFAULT_SETTINGS[key];
  if (typeof defaultVal === "boolean") return raw === "true";
  if (typeof defaultVal === "number") {
    const n = parseFloat(raw);
    return isNaN(n) ? defaultVal : n;
  }
  return raw;
}

export async function getSettings(): Promise<StoreSettings> {
  try {
    const rows = await db.setting.findMany();
    const map: Record<string, string | number | boolean> = {};
    for (const row of rows) map[row.key] = row.value;
    const result: Record<string, string | number | boolean> = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof StoreSettings)[]) {
      if (map[key] !== undefined) result[key] = coerce(key, String(map[key]));
    }
    return result as unknown as StoreSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(patch: Record<string, unknown>): Promise<StoreSettings> {
  const entries = Object.entries(patch).filter(([key]) => key in DEFAULT_SETTINGS);
  for (const [key, value] of entries) {
    await db.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  return getSettings();
}
