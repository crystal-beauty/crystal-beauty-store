"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Power, Package } from "lucide-react";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney, parseMedia } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProductImage from "@/components/ui/product-image";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  trackStock: boolean;
  active: boolean;
  featured: boolean;
  media: string;
  category: { name: string } | null;
  variants: { id: string }[];
  _count: { orderItems: number };
}

export default function ProductsManager({ canDelete }: { canDelete: boolean }) {
  const settings = useSettings();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error("Impossible de charger les produits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(p: ProductRow) {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, media: p.media, active: !p.active }),
    });
    if (res.ok) {
      toast.success(p.active ? "Produit masqué de la boutique" : "Produit publié");
      load(search);
    } else {
      toast.error("Impossible de mettre à jour le produit");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.softDeleted ? "Produit archivé (a des commandes)" : "Produit supprimé");
        load(search);
      } else {
        toast.error(data.error || "Impossible de supprimer");
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Produits</h1>
          <p className="text-sm text-muted-foreground mt-1">Créez, modifiez, masquez ou supprimez les cadeaux de votre boutique.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nouveau produit
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            const t = setTimeout(() => load(e.target.value), 300);
            return () => clearTimeout(t);
          }}
          placeholder="Rechercher par nom ou SKU…"
          className="w-full bg-white border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chargement des produits…</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--primary)]">Aucun produit pour le moment</p>
            <p className="text-xs text-muted-foreground mt-1">Créez votre premier cadeau pour commencer à vendre.</p>
            <Link href="/admin/products/new" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:underline">
              <Plus className="h-4 w-4" /> Ajouter mon premier produit
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-5 py-3 font-semibold text-[var(--primary)]">Produit</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Catégorie</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Prix</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Stock</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)]">Statut</th>
                  <th className="px-4 py-3 font-semibold text-[var(--primary)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => {
                  const media = parseMedia(p.media);
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0">
                            <ProductImage src={media[0]?.url} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--primary)] truncate max-w-[220px]">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.variants.length > 0 && `${p.variants.length} variante${p.variants.length > 1 ? "s" : ""} · `}
                              {p._count.orderItems} vendu(s)
                              {p.featured && <span className="text-[var(--brand)] font-medium"> · Mis en avant</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category?.name || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-[var(--primary)]">{formatMoney(p.price, settings)}</td>
                      <td className="px-4 py-3">
                        {p.trackStock ? (
                          <span className={cn(
                            "font-medium",
                            p.stock <= 3 ? "text-[var(--primary)]" : "text-[var(--primary)]"
                          )}>
                            {p.stock}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">∞</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                            p.active ? "bg-[#e8ecf5] text-[#0a1f44] border-[#d7deea]" : "bg-gray-100 text-gray-500 border-gray-200"
                          )}
                        >
                          {p.active ? "Publié" : "Masqué"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleActive(p)}
                            title={p.active ? "Masquer de la boutique" : "Publier dans la boutique"}
                            className="p-2 rounded-lg text-muted-foreground hover:text-[var(--primary)] hover:bg-muted transition-colors"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/products/${p.id}`}
                            title="Modifier"
                            className="p-2 rounded-lg text-muted-foreground hover:text-[var(--primary)] hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(p)}
                              title="Supprimer"
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleteTarget?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprime définitivement le produit, ses variantes et ses options. S'il a déjà des commandes,
              il sera archivé pour préserver l'historique. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Suppression…" : "Supprimer le produit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
