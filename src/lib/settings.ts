import { db } from "@/lib/db";

export interface StoreSettings {
  // General
  storeName: string;
  tagline: string;
  logoUrl: string;
  // Appearance
  primaryColor: string; // deep navy
  accentColor: string; // gold
  // Announcement
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  // Hero
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtaText: string;
  heroCtaLink: string;
  // Currency
  currencyCode: string;
  currencySymbol: string;
  // Gift box
  giftBoxEnabled: boolean;
  giftBoxFee: number;
  giftBoxLabel: string;
  giftBoxDescription: string;
  // Shipping
  freeShippingThreshold: number;
  originCountry: string;
  // World Express
  worldExpressEnabled: boolean;
  worldExpressApiUrl: string;
  worldExpressApiKey: string;
  worldExpressCustomerId: string;
  // Payment
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  bankInstructions: string;
  // Contact / footer
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  footerAbout: string;
  footerText: string;
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
  tagline: "Gifts that feel like magic",
  logoUrl: "",
  primaryColor: "#0A1F44",
  accentColor: "#C8A24B",
  announcementEnabled: true,
  announcementText: "Free World Express delivery on orders over $120 ✨ Hand-picked gifts, wrapped with love",
  announcementLink: "/products",
  heroTitle: "Gifts That Feel Like Magic",
  heroSubtitle: "Hand-picked crystal decor and timeless treasures, delivered worldwide with World Express. Every gift tells a story — make theirs unforgettable.",
  heroImage: "/uploads/hero.jpg",
  heroCtaText: "Shop the Collection",
  heroCtaLink: "/products",
  currencyCode: "USD",
  currencySymbol: "$",
  giftBoxEnabled: true,
  giftBoxFee: 6,
  giftBoxLabel: "Add an elegant gift box",
  giftBoxDescription: "A premium navy gift box with satin ribbon and a handwritten note card. Our gifts are sold as single pieces by default — add a box if you'd like the full wrapping experience.",
  freeShippingThreshold: 120,
  originCountry: "United Arab Emirates",
  worldExpressEnabled: true,
  worldExpressApiUrl: "",
  worldExpressApiKey: "",
  worldExpressCustomerId: "",
  codEnabled: true,
  bankTransferEnabled: true,
  bankInstructions: "Transfer to: Lumina Gifts Trading LLC — IBAN AE00 0000 0000 0000 0000 000 — Send the receipt to WhatsApp +971 50 000 0000 to confirm.",
  contactPhone: "+971 50 000 0000",
  contactEmail: "hello@luminagifts.com",
  contactAddress: "Business Bay, Dubai, United Arab Emirates",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  footerAbout: "Curated crystal decor and gifts that turn ordinary moments into memories. Loved by thousands of gifters around the world.",
  footerText: "© {year} {store}. All rights reserved.",
  metaPixelEnabled: false,
  metaPixelId: "",
  metaCapiToken: "",
  metaTestEventCode: "",
  metaAdvancedMatching: true,
  seoTitle: "Lumina Gifts — Crystal Decor & Thoughtful Gifts",
  seoDescription: "Shop hand-picked crystal balls, decor and gifts. Fast worldwide shipping with World Express. Gift boxes available on request.",
};

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
