"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save, Loader2, ArrowLeft, Upload, Link2, Trash2, Plus, X, GripVertical,
  ImageIcon, ChevronUp, ChevronDown, Package, RefreshCw,
} from "lucide-react";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney, slugify, type MediaItem } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ProductImage from "@/components/ui/product-image";

interface VariantOptionDraft {
  label: string;
  priceModifier: number;
  hexColor: string;
  stock: string;
}
interface VariantDraft {
  name: string;
  required: boolean;
  options: VariantOptionDraft[];
}
interface CategoryOption {
  id: string;
  name: string;
}
export interface ProductEditorData {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: string;
  comparePrice: string;
  costPrice: string;
  weightGrams: string;
  stock: string;
  trackStock: boolean;
  active: boolean;
  featured: boolean;
  media: MediaItem[];
  categoryId: string;
  variants: VariantDraft[];
}

function getEmptyProduct(): ProductEditorData {
  return {
    name: "",
    slug: "",
    sku: "",
    shortDescription: "",
    description: "",
    price: "",
    comparePrice: "",
    costPrice: "",
    weightGrams: "500",
    stock: "10",
    trackStock: true,
    active: true,
    featured: false,
    media: [],
    categoryId: "",
    variants: [],
  };
}

export default function ProductEditor({
  initial,
  categories,
  productId,
}: {
  initial?: ProductEditorData;
  categories: CategoryOption[];
  productId?: string;
}) {
  const router = useRouter();
  const settings = useSettings();
  const [data, setData] = useState<ProductEditorData>(() => initial ? { ...initial } : getEmptyProduct());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const isEdit = Boolean(productId);

  useEffect(() => {
    setData(initial ? { ...initial } : getEmptyProduct());
  }, [productId, initial]);

  const set = <K extends keyof ProductEditorData>(key: K, value: ProductEditorData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  // auto-slug from name
  useEffect(() => {
    if (!isEdit && data.name) set("slug", slugify(data.name));
     
  }, [data.name]);

  async function save() {
    if (!data.name.trim()) return toast.error("Le nom du produit est obligatoire");
    if (!data.price || isNaN(parseFloat(data.price))) return toast.error("Saisissez un prix valide");
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        slug: data.slug || slugify(data.name),
        sku: data.sku,
        shortDescription: data.shortDescription,
        description: data.description,
        price: parseFloat(data.price),
        comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
        weightGrams: parseInt(data.weightGrams) || 500,
        stock: parseInt(data.stock) || 0,
        trackStock: data.trackStock,
        active: data.active,
        featured: data.featured,
        media: data.media,
        categoryId: data.categoryId || null,
        variants: data.variants.map((v, i) => ({
          name: v.name,
          required: v.required,
          sortOrder: i,
          options: v.options.map((o, oi) => ({
            label: o.label,
            priceModifier: parseFloat(String(o.priceModifier)) || 0,
            hexColor: o.hexColor || null,
            stock: o.stock === "" ? null : parseInt(o.stock),
            sortOrder: oi,
          })),
        })),
      };
      const res = await fetch(isEdit ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || "Impossible d'enregistrer le produit");
        return;
      }
      toast.success(isEdit ? "Produit mis à jour" : "Produit créé");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Erreur réseau — réessayez");
    } finally {
      setSaving(false);
    }
  }

  // ---------- media ----------
  async function uploadFiles(files: FileList, replaceIndex?: number) {
    setUploading(true);
    try {
      const uploaded: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        if (productId || data.slug) {
          fd.append("productId", productId || data.slug);
        }
        if (replaceIndex !== undefined && data.media[replaceIndex]?.url) {
          fd.append("previousUrl", data.media[replaceIndex].url);
        }
        const res = await fetch("/api/admin/products/upload", { method: "POST", body: fd });
        const resData = await res.json();
        if (!res.ok) {
          toast.error(resData.error || "Échec du téléversement");
          continue;
        }
        uploaded.push({ type: resData.type || "image", url: resData.url, alt: data.name });
      }
      if (uploaded.length) {
        if (replaceIndex !== undefined && replaceIndex >= 0 && replaceIndex < data.media.length) {
          const next = [...data.media];
          next[replaceIndex] = uploaded[0];
          set("media", next);
          toast.success("Photo remplacée avec succès !");
        } else {
          set("media", [...data.media, ...uploaded]);
          toast.success("Photo ajoutée !");
        }
      }
    } catch {
      toast.error("Erreur de téléversement réseau");
    } finally {
      setUploading(false);
      setReplacingIndex(null);
      if (fileRef.current) fileRef.current.value = "";
      if (replaceRef.current) replaceRef.current.value = "";
    }
  }

  function addUrl() {
    if (!urlInput.trim()) return;
    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(urlInput.trim());
    set("media", [...data.media, { type: isVideo ? "video" : "image", url: urlInput.trim(), alt: data.name }]);
    setUrlInput("");
  }

  function moveMedia(index: number, dir: -1 | 1) {
    const next = [...data.media];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("media", next);
  }

  // ---------- variants ----------
  function addVariant() {
    set("variants", [...data.variants, { name: "", required: true, options: [{ label: "", priceModifier: 0, hexColor: "", stock: "" }] }]);
  }

  function updateVariant(vi: number, patch: Partial<VariantDraft>) {
    set("variants", data.variants.map((v, i) => (i === vi ? { ...v, ...patch } : v)));
  }

  function updateOption(vi: number, oi: number, patch: Partial<VariantOptionDraft>) {
    set("variants", data.variants.map((v, i) =>
      i === vi ? { ...v, options: v.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : v
    ));
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2.5 rounded-xl border border-border bg-white text-[var(--primary)] hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--primary)]">
              {isEdit ? "Modifier le produit" : "Nouveau produit"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit ? "Détails, médias, variantes et tarifs" : "Ajoutez un beau cadeau à votre boutique"}
            </p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[var(--brand)] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#16305c] transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Enregistrer" : "Créer le produit"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============ MAIN COLUMN ============ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Product Name *</label>
                <input value={data.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Enchanted Crystal Ball" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>URL Slug</label>
                  <input value={data.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} placeholder="enchanted-crystal-ball" />
                </div>
                <div>
                  <label className={labelCls}>SKU</label>
                  <input value={data.sku} onChange={(e) => set("sku", e.target.value)} className={inputCls} placeholder="CB-001" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Short Description</label>
                <input value={data.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={inputCls} placeholder="One line shown under the title on the product page" />
              </div>
              <div>
                <label className={labelCls}>Full Description</label>
                <textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={5} className={inputCls} placeholder="Tell the story of this gift — materials, size, what makes it special…" />
              </div>
            </div>
          </section>

          {/* Media manager */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-1">Media Gallery</h2>
            <p className="text-xs text-muted-foreground mb-4">Add multiple photos and videos. The first item becomes the main image.</p>

            {/* Upload */}
            <div className="flex flex-wrap gap-3 mb-5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Photos / Videos
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.heic,.heif,video/mp4,video/webm,video/quicktime"
                multiple
                hidden
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />
              <input
                ref={replaceRef}
                type="file"
                accept="image/*,.heic,.heif,video/mp4,video/webm,video/quicktime"
                hidden
                onChange={(e) => {
                  if (e.target.files && replacingIndex !== null) {
                    uploadFiles(e.target.files, replacingIndex);
                  }
                }}
              />
              <div className="flex-1 min-w-[200px] flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="…or paste an image / video URL"
                    className="w-full bg-white border border-input rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  />
                </div>
                <button type="button" onClick={addUrl} className="bg-muted hover:bg-border text-[var(--primary)] text-sm font-medium px-4 rounded-xl transition-colors">
                  Add
                </button>
              </div>
            </div>

            {/* Media grid */}
            {data.media.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune photo pour l'instant — téléversez des photos ou collez des liens</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {data.media.map((m, i) => (
                  <div key={i} className="flex flex-col rounded-xl overflow-hidden border border-border bg-card shadow-xs">
                    <div className="relative aspect-square bg-muted">
                      {m.type === "video" ? (
                        <video src={m.url} className="h-full w-full object-cover" muted />
                      ) : (
                        <ProductImage src={m.url} alt={m.alt || ""} className="h-full w-full object-cover" />
                      )}
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          Principale
                        </span>
                      )}
                      {m.type === "video" && (
                        <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">VIDEO</span>
                      )}
                    </div>

                    {/* Action buttons — ALWAYS visible on mobile & desktop */}
                    <div className="p-1.5 bg-muted/40 flex items-center justify-between gap-1 border-t border-border/60">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveMedia(i, -1)}
                          disabled={i === 0}
                          className="p-1 rounded text-neutral-600 hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Déplacer vers la gauche"
                        >
                          <ChevronUp className="h-3.5 w-3.5 -rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveMedia(i, 1)}
                          disabled={i === data.media.length - 1}
                          className="p-1 rounded text-neutral-600 hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Déplacer vers la droite"
                        >
                          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplacingIndex(i);
                            replaceRef.current?.click();
                          }}
                          className="p-1 rounded text-neutral-600 hover:bg-muted transition-colors"
                          title="Remplacer la photo"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          set("media", data.media.filter((_, j) => j !== i));
                          toast.success("Photo supprimée");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                        title="Supprimer cette photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Variants builder */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-lg font-semibold text-[var(--primary)]">Variantes et options</h2>
              <button type="button" onClick={addVariant} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:underline">
                <Plus className="h-4 w-4" /> Ajouter une variante
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Groupes d'options comme <strong>Taille</strong> ou <strong>Couleur</strong>. Chaque choix peut ajuster le prix.
            </p>

            {data.variants.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune variante — le produit se vend comme une pièce standard</p>
              </div>
            ) : (
              <div className="space-y-5">
                {data.variants.map((variant, vi) => (
                  <div key={vi} className="rounded-xl border border-border p-4 bg-muted/30">
                    <div className="flex items-center gap-3 mb-4">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                      <input
                        value={variant.name}
                        onChange={(e) => updateVariant(vi, { name: e.target.value })}
                        placeholder="Nom de la variante (ex. Taille, Couleur)"
                        className="flex-1 bg-white border border-input rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={variant.required}
                          onChange={(e) => updateVariant(vi, { required: e.target.checked })}
                          className="h-3.5 w-3.5 accent-[var(--primary)]"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => set("variants", data.variants.filter((_, i) => i !== vi))}
                        className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                        title="Retirer la variante"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {variant.options.map((option, oi) => (
                        <div key={oi} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            value={option.label}
                            onChange={(e) => updateOption(vi, oi, { label: e.target.value })}
                            placeholder="Option (ex. Grande)"
                            className="col-span-12 sm:col-span-4 bg-white border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                          />
                          <div className="col-span-4 sm:col-span-3 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">+</span>
                            <input
                              type="number" step="0.01"
                              value={option.priceModifier || ""}
                              onChange={(e) => updateOption(vi, oi, { priceModifier: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-full bg-white border border-input rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                            />
                          </div>
                          <div className="col-span-3 sm:col-span-2">
                            <input
                              type="color"
                              value={option.hexColor || "#0a1f44"}
                              onChange={(e) => updateOption(vi, oi, { hexColor: e.target.value })}
                              title="Pastille de couleur (optionnel)"
                              className="w-full h-9 rounded-lg border border-input cursor-pointer bg-white p-1"
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <input
                              type="number"
                              value={option.stock}
                              onChange={(e) => updateOption(vi, oi, { stock: e.target.value })}
                              placeholder="Stock"
                              title="Stock par option (optionnel)"
                              className="w-full bg-white border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => updateVariant(vi, { options: variant.options.filter((_, j) => j !== oi) })}
                            className="col-span-1 justify-self-end p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                            title="Retirer l'option"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => updateVariant(vi, { options: [...variant.options, { label: "", priceModifier: 0, hexColor: "", stock: "" }] })}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:text-[var(--brand)]"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Option
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ============ SIDE COLUMN ============ */}
        <div className="space-y-6">
          {/* Pricing */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Prix (DA) *</label>
                <input type="number" min={0} value={data.price} onChange={(e) => set("price", e.target.value)} className={inputCls} placeholder="4900" />
              </div>
              <div>
                <label className={labelCls}>Ancien prix (optionnel)</label>
                <input type="number" min={0} value={data.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} className={inputCls} placeholder="Laisser vide si aucun" />
                {data.comparePrice && parseFloat(data.price) < parseFloat(data.comparePrice) && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    L&apos;ancien prix barré s&apos;affichera : {formatMoney(parseFloat(data.comparePrice) || 0, settings)} → {formatMoney(parseFloat(data.price) || 0, settings)}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Prix d&apos;achat (interne)</label>
                <input type="number" step="0.01" value={data.costPrice} onChange={(e) => set("costPrice", e.target.value)} className={inputCls} placeholder="Pour vos marges" />
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Inventaire</h2>
            <label className="flex items-center gap-2.5 text-sm text-[var(--primary)] mb-3">
              <input type="checkbox" checked={data.trackStock} onChange={(e) => set("trackStock", e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
              Suivre le stock (masquer quand épuisé)
            </label>
            {data.trackStock && (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Quantité en stock</label>
                  <input type="number" value={data.stock} onChange={(e) => set("stock", e.target.value)} className={inputCls} />
                  <p className="text-xs text-muted-foreground mt-1.5">Affiché en clair sur la fiche produit (« En stock (n) »).</p>
                </div>
                <div>
                  <label className={labelCls}>Poids (grammes)</label>
                  <input type="number" min={0} value={data.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} className={inputCls} />
                  <p className="text-xs text-muted-foreground mt-1.5">Pour vos préparations — l&apos;API actuelle du transporteur ne l&apos;utilise pas dans le calcul du tarif.</p>
                </div>
              </div>
            )}
          </section>

          {/* Organization */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Organisation</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Catégorie</label>
                <select value={data.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputCls}>
                  <option value="">Sans catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-[var(--primary)]">
                <input type="checkbox" checked={data.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                Featured (shows on homepage bestsellers)
              </label>
              <label className="flex items-center gap-2.5 text-sm text-[var(--primary)]">
                <input type="checkbox" checked={data.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                Active (visible in store)
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
