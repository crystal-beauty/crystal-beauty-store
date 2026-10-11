"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingsShape {
  [key: string]: string | number | boolean;
}

const TABS = [
  { id: "general", label: "Général" },
  { id: "appearance", label: "Apparence" },
  { id: "announcement", label: "Annonce" },
  { id: "hero", label: "Hero" },
  { id: "giftbox", label: "Boîte cadeau" },
  { id: "contact", label: "Contact & réseaux" },
  { id: "policies", label: "Pages politiques" },
  { id: "delivery", label: "Livraison" },
  { id: "footer", label: "Pied de page" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsManager({ initial }: { initial: Record<string, string | number | boolean> }) {
  const [tab, setTab] = useState<TabId>("general");
  const [form, setForm] = useState<SettingsShape>(initial);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: string | number | boolean) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Paramètres enregistrés.");
    } catch {
      toast.error("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";
  const hintCls = "mt-1 text-xs text-muted-foreground";

  const TextField = ({ k, label, hint, placeholder, type = "text", dir }: { k: string; label: string; hint?: string; placeholder?: string; type?: string; dir?: string }) => (
    <div>
      <label className={labelCls} htmlFor={`f-${k}`}>
        {label}
      </label>
      <input id={`f-${k}`} type={type} dir={dir} value={String(form[k] ?? "")} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} className={inputCls} />
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  );

  const TextArea = ({ k, label, hint, rows = 4, dir }: { k: string; label: string; hint?: string; rows?: number; dir?: string }) => (
    <div>
      <label className={labelCls} htmlFor={`f-${k}`}>
        {label}
      </label>
      <textarea id={`f-${k}`} rows={rows} dir={dir} value={String(form[k] ?? "")} onChange={(e) => set(k, e.target.value)} className={inputCls} />
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  );

  const Toggle = ({ k, label, hint }: { k: string; label: string; hint?: string }) => (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={Boolean(form[k])} onChange={(e) => set(k, e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--primary)]" />
      <div>
        <p className="text-sm font-medium text-[var(--primary)]">{label}</p>
        {hint && <p className={hintCls}>{hint}</p>}
      </div>
    </label>
  );

  const NumField = ({ k, label, hint }: { k: string; label: string; hint?: string }) => (
    <div>
      <label className={labelCls} htmlFor={`f-${k}`}>
        {label}
      </label>
      <input
        id={`f-${k}`}
        type="number"
        min={0}
        value={String(form[k] ?? "")}
        onChange={(e) => set(k, e.target.value === "" ? "" : Number(e.target.value))}
        className={inputCls}
        dir="ltr"
      />
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  );

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe space-y-4">
      <h2 className="font-display text-lg font-semibold text-[var(--primary)]">{title}</h2>
      {children}
    </section>
  );

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--primary)]">Paramètres</h1>
          <p className="text-sm text-muted-foreground mt-1">Tout ce qui est vide n&apos;apparaît pas sur la boutique — aucune fausse information.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[var(--brand)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#16305c] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-colors",
              tab === t.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white text-[var(--primary)] border-border hover:bg-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 max-w-3xl">
        {tab === "general" && (
          <>
            <Card title="Identité">
              <TextField k="storeName" label="Nom de la boutique" />
              <TextField k="tagline" label="Slogan (optionnel)" hint="Affiché au-dessus du titre du hero." />
              <TextField k="logoUrl" label="URL du logo" hint="Laisser vide pour l'icône par défaut." placeholder="/logo.svg" />
            </Card>
          </>
        )}

        {tab === "appearance" && (
          <Card title="Couleurs de la marque">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="f-primaryColor">
                  Couleur principale (bleu foncé)
                </label>
                <div className="flex gap-2">
                  <input type="color" value={String(form.primaryColor)} onChange={(e) => set("primaryColor", e.target.value)} className="h-11 w-14 rounded-xl border border-input" aria-label="Couleur principale" />
                  <input value={String(form.primaryColor)} onChange={(e) => set("primaryColor", e.target.value)} className={inputCls} dir="ltr" />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="f-accentColor">
                  Couleur d&apos;accent
                </label>
                <div className="flex gap-2">
                  <input type="color" value={String(form.accentColor)} onChange={(e) => set("accentColor", e.target.value)} className="h-11 w-14 rounded-xl border border-input" aria-label="Accent" />
                  <input value={String(form.accentColor)} onChange={(e) => set("accentColor", e.target.value)} className={inputCls} dir="ltr" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Charte : bleu marine (#0A1F44), noir (#111111) ou blanc (#FFFFFF) uniquement.</p>
              </div>
            </div>
          </Card>
        )}

        {tab === "announcement" && (
          <Card title="Bandeau d'annonce">
            <Toggle k="announcementEnabled" label="Afficher le bandeau" />
            <TextField k="announcementText" label="Texte (français)" placeholder="Ex : Livraison 58 wilayas — paiement à la livraison" />
            <TextField k="announcementTextAr" label="النص (بالعربية)" placeholder="مثال: التوصيل إلى 58 ولاية — الدفع عند الاستلام" dir="rtl" />
            <TextField k="announcementLink" label="Lien du bandeau" placeholder="/products" />
          </Card>
        )}

        {tab === "hero" && (
          <Card title="Section hero (page d'accueil)">
            <TextField k="heroTitle" label="Titre (français)" />
            <TextField k="heroTitleAr" label="العنوان (بالعربية)" dir="rtl" />
            <TextArea k="heroSubtitle" label="Sous-titre (français)" rows={3} />
            <TextArea k="heroSubtitleAr" label="العنوان الفرعي (بالعربية)" rows={3} dir="rtl" />
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField k="heroImage" label="Image du hero - Desktop (URL)" hint="Format paysage recommandé (16:9)." />
              <TextField k="heroImageMobile" label="Image du hero - Mobile (URL)" hint="Format portrait vertical (9:16)." />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField k="heroCtaText" label="Texte du bouton" />
              <TextField k="heroCtaLink" label="Lien du bouton" />
            </div>
          </Card>
        )}

        {tab === "giftbox" && (
          <Card title="Boîte cadeau (optionnelle)">
            <p className="text-sm text-muted-foreground -mt-2">
              Rappel : les cadeaux sont vendus à la pièce sans emballage. La boîte n&apos;est qu&apos;une option que le client choisit.
            </p>
            <Toggle k="giftBoxEnabled" label="Proposer la boîte cadeau" />
            <NumField k="giftBoxFee" label="Prix de la boîte (DA)" />
            <TextField k="giftBoxLabel" label="Libellé (français)" />
            <TextField k="giftBoxLabelAr" label="التسمية (بالعربية)" dir="rtl" />
            <TextArea k="giftBoxDescription" label="Description (français)" rows={2} />
            <TextArea k="giftBoxDescriptionAr" label="الوصف (بالعربية)" rows={2} dir="rtl" />
          </Card>
        )}

        {tab === "contact" && (
          <Card title="Coordonnées (affichées uniquement si remplies)">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField k="contactPhone" label="Téléphone affiché" placeholder="0555 12 34 56" />
              <TextField k="whatsappNumber" label="Numéro WhatsApp" hint="Format 05/06/07 ou +213 — utilisé par tous les boutons WhatsApp." />
            </div>
            <TextField k="contactEmail" label="Email" type="email" />
            <TextField k="contactAddress" label="Adresse" />
            <TextField k="contactHours" label="Horaires" placeholder="Ex : Sam–Jeu, 9h–18h" />
          </Card>
        )}

        {tab === "contact" && (
          <Card title="Réseaux sociaux (affichés uniquement si remplis)">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField k="facebookUrl" label="Facebook" placeholder="https://…" />
              <TextField k="instagramUrl" label="Instagram" placeholder="https://…" />
              <TextField k="tiktokUrl" label="TikTok" placeholder="https://…" />
              <TextField k="twitterUrl" label="X / Twitter" placeholder="https://…" />
            </div>
          </Card>
        )}

        {tab === "policies" && (
          <>
            <Card title="Page Livraison">
              <TextArea k="policyDelivery" label="Contenu (français)" rows={6} hint="Affichée sur /policies/delivery — la page n'existe pas tant que ce champ est vide." />
              <TextArea k="policyDeliveryAr" label="المحتوى (بالعربية)" rows={6} dir="rtl" />
            </Card>
            <Card title="Page Retours">
              <TextArea k="policyReturns" label="Contenu (français)" rows={6} />
              <TextArea k="policyReturnsAr" label="المحتوى (بالعربية)" rows={6} dir="rtl" />
            </Card>
            <Card title="Page Confidentialité">
              <TextArea k="policyPrivacy" label="Contenu (français)" rows={6} />
              <TextArea k="policyPrivacyAr" label="المحتوى (بالعربية)" rows={6} dir="rtl" />
            </Card>
          </>
        )}

        {tab === "delivery" && (
          <Card title="Préférences de livraison">
            <p className="text-sm text-muted-foreground -mt-2">
              Les tarifs de livraison ne se règlent pas ici : ils viennent en direct de l&apos;API du transporteur (voir Livraison → transporteur).
            </p>
            <Toggle
              k="canOpenParcel"
              label="Autoriser le client à ouvrir le colis avant de payer (can_open)"
              hint="Envoyé au transporteur à la création du colis."
            />
          </Card>
        )}

        {tab === "footer" && (
          <Card title="Pied de page">
            <TextArea k="footerAbout" label="À propos (affiché si rempli)" rows={3} />
            <TextField k="footerText" label="Texte de copyright" hint="Variables : {year} et {store}." />
          </Card>
        )}

        {tab === "seo" && (
          <Card title="SEO">
            <TextField k="seoTitle" label="Titre du site" />
            <TextArea k="seoDescription" label="Description" rows={3} />
          </Card>
        )}
      </div>

      <div className="mt-6 max-w-3xl">
        <button onClick={save} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-white font-semibold py-3.5 rounded-xl hover:bg-[#16305c] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer les paramètres
        </button>
      </div>
    </div>
  );
}
