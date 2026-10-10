"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, FolderTree, Loader2, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
  _count: { products: number };
}

const empty = { name: "", description: "", image: "", sortOrder: 0, active: true };

export default function CategoriesManager({ canDelete }: { canDelete: boolean }) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", image: c.image || "", sortOrder: c.sortOrder, active: c.active });
    setDialogOpen(true);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setForm((f) => ({ ...f, image: data.url }));
      else toast.error(data.error || "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Le nom de la catégorie est obligatoire");
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Impossible d'enregistrer");
      toast.success(editing ? "Catégorie mise à jour" : "Catégorie créée");
      setDialogOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Catégorie supprimée");
      load();
    } else {
      toast.error(data.error || "Impossible de supprimer");
    }
    setDeleteTarget(null);
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Catégories</h1>
          <p className="text-sm text-muted-foreground mt-1">Regroupez vos cadeaux en collections pour la boutique.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nouvelle catégorie
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center">
            <FolderTree className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--primary)]">Aucune catégorie pour le moment</p>
            <p className="text-xs text-muted-foreground mt-1">Créez-en une pour organiser vos produits.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0">
                  {c.image && (
                     
                    <img src={c.image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--primary)] truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{c.slug} · {c._count.products} produit(s) · ordre {c.sortOrder}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0",
                    c.active ? "bg-[#e8ecf5] text-[#0a1f44] border-[#d7deea]" : "bg-gray-100 text-gray-500 border-gray-200"
                  )}
                >
                  {c.active ? "Active" : "Masquée"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-muted-foreground hover:text-[var(--primary)] hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button onClick={() => setDeleteTarget(c)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDialogOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-luxe-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-[var(--primary)]">
                {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </h2>
              <button onClick={() => setDialogOpen(false)} className="p-2 text-muted-foreground hover:text-[var(--primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Nom *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Déco cristal" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Image de couverture</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Téléversement…" : "Téléverser une image"}
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                  </label>
                  {form.image && (
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border shrink-0">
                      { }
                      <img src={form.image} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setForm({ ...form, image: "" })}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Ordre d'affichage</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-[var(--primary)]">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                    Active
                  </label>
                </div>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="w-full bg-[var(--brand)] text-white font-semibold py-3 rounded-xl hover:bg-[#16305c] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer" : "Créer la catégorie"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleteTarget?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les produits de cette catégorie resteront dans la boutique mais deviendront sans catégorie. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
