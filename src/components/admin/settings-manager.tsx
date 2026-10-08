"use client";

import { useState } from "react";
import { Save, Loader2, Store, Palette, Image as ImageIcon, Gift, CreditCard, Phone, FileText } from "lucide-react";
import type { StoreSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TABS = [
  { key: "general", label: "General", icon: Store },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "hero", label: "Homepage", icon: ImageIcon },
  { key: "giftbox", label: "Gift Box", icon: Gift },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "contact", label: "Contact & Social", icon: Phone },
  { key: "seo", label: "SEO & Footer", icon: FileText },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsManager({ initial }: { initial: StoreSettings }) {
  const [tab, setTab] = useState<TabKey>("general");
  const [form, setForm] = useState<StoreSettings>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) return toast.error("Could not save settings");
      toast.success("Settings saved — refresh the storefront to see changes");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";
  const sectionCls = "bg-white rounded-2xl border border-border p-6 shadow-luxe";

  const text = (key: keyof StoreSettings, label: string, placeholder?: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input value={String(form[key])} onChange={(e) => set(key, e.target.value as never)} className={inputCls} placeholder={placeholder} />
    </div>
  );

  const textarea = (key: keyof StoreSettings, label: string, rows = 3, placeholder?: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea value={String(form[key])} onChange={(e) => set(key, e.target.value as never)} rows={rows} className={inputCls} placeholder={placeholder} />
    </div>
  );

  const toggle = (key: keyof StoreSettings, label: string, desc?: string) => (
    <label className="flex items-start gap-2.5 text-sm text-[var(--primary)] cursor-pointer">
      <input
        type="checkbox"
        checked={Boolean(form[key])}
        onChange={(e) => set(key, e.target.checked as never)}
        className="h-4 w-4 accent-[var(--primary)] mt-0.5"
      />
      <span>
        {label}
        {desc && <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>}
      </span>
    </label>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Store Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Everything on the storefront is editable from here.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[var(--gold)] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#b8903a] transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors",
              tab === t.key
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-white text-[var(--primary)] border-border hover:border-[var(--primary)]"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== General ===== */}
      {tab === "general" && (
        <section className={sectionCls}>
          <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5">General</h2>
          <div className="space-y-4">
            {text("storeName", "Store Name")}
            {text("tagline", "Tagline")}
            {text("logoUrl", "Logo URL (optional)", "/uploads/logo.png")}
            <div className="grid sm:grid-cols-3 gap-4">
              {text("currencyCode", "Currency Code", "USD")}
              {text("currencySymbol", "Currency Symbol", "$")}
              {text("freeShippingThreshold", "Free Shipping Over", "120")}
            </div>
          </div>
        </section>
      )}

      {/* ===== Appearance ===== */}
      {tab === "appearance" && (
        <section className={sectionCls}>
          <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-1">Appearance</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Colors apply instantly across the storefront (buttons, links, footer, accents).
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Primary Color (deep navy)</label>
              <div className="flex gap-3">
                <input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-11 w-14 rounded-xl border border-input cursor-pointer p-1" />
                <input value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Accent Color (gold)</label>
              <div className="flex gap-3">
                <input type="color" value={form.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="h-11 w-14 rounded-xl border border-input cursor-pointer p-1" />
                <input value={form.accentColor} onChange={(e) => set("accentColor", e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {toggle("announcementEnabled", "Show announcement bar", "A slim bar above the header for promos & shipping offers")}
            {text("announcementText", "Announcement Text")}
            {text("announcementLink", "Announcement Link", "/products")}
          </div>
        </section>
      )}

      {/* ===== Homepage ===== */}
      {tab === "hero" && (
        <section className={sectionCls}>
          <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5">Homepage Content</h2>
          <div className="space-y-4">
            {text("heroTitle", "Hero Title")}
            {textarea("heroSubtitle", "Hero Subtitle", 3)}
            {text("heroImage", "Hero Image URL", "/uploads/hero.jpg")}
            <div className="grid sm:grid-cols-2 gap-4">
              {text("heroCtaText", "Button Text", "Shop the Collection")}
              {text("heroCtaLink", "Button Link", "/products")}
            </div>
            {textarea("footerAbout", "Footer About Text", 3)}
          </div>
          {form.heroImage && (
            <div className="mt-5 rounded-xl overflow-hidden border border-border max-w-sm">
              { }
              <img src={form.heroImage} alt="Hero preview" className="w-full aspect-video object-cover" />
            </div>
          )}
        </section>
      )}

      {/* ===== Gift box ===== */}
      {tab === "giftbox" && (
        <section className={sectionCls}>
          <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-1">Gift Box Add-On</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Your store sells single-piece gifts by default — this optional add-on lets customers request a box.
          </p>
          <div className="space-y-4">
            {toggle("giftBoxEnabled", "Offer gift boxes as an add-on")}
            <div className="grid sm:grid-cols-2 gap-4">
              {text("giftBoxFee", "Gift Box Fee", "6")}
              {text("giftBoxLabel", "Checkbox Label", "Add an elegant gift box")}
            </div>
            {textarea("giftBoxDescription", "Description Shown on Product Page", 3)}
          </div>
        </section>
      )}

      {/* ===== Payments ===== */}
      {tab === "payments" && (
        <section className={sectionCls}>
          <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5">Payment Methods</h2>
          <div className="space-y-5">
            {toggle("codEnabled", "Cash on Delivery", "Customers pay when the gift arrives")}
            {toggle("bankTransferEnabled", "Bank Transfer", "Show transfer instructions after ordering")}
            {textarea("bankInstructions", "Bank Transfer Instructions", 3, "IBAN, account name, WhatsApp number…")}
          </div>
        </section>
      )}

      {/* ===== Contact ===== */}
      {tab === "contact" && (
        <section className={sectionCls}>
          <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5">Contact & Social</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {text("contactPhone", "Phone / WhatsApp")}
              {text("contactEmail", "Email")}
            </div>
            {text("contactAddress", "Address")}
            <div className="grid sm:grid-cols-2 gap-4">
              {text("instagramUrl", "Instagram URL")}
              {text("facebookUrl", "Facebook URL")}
              {text("tiktokUrl", "TikTok URL")}
              {text("twitterUrl", "X / Twitter URL")}
            </div>
          </div>
        </section>
      )}

      {/* ===== SEO ===== */}
      {tab === "seo" && (
        <section className={sectionCls}>
          <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5">SEO & Footer</h2>
          <div className="space-y-4">
            {text("seoTitle", "SEO Title")}
            {textarea("seoDescription", "SEO Description", 2)}
            {textarea("footerText", "Footer Copyright Line", 2, "Use {year} and {store} as placeholders")}
          </div>
        </section>
      )}
    </div>
  );
}
