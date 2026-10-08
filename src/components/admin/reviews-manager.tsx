"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, Check, EyeOff, Trash2, Loader2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewRow {
  id: string;
  orderId: string;
  token: string;
  customerName: string;
  wilayaName: string;
  rating: number;
  text: string;
  approved: boolean;
  submitted: boolean;
  createdAt: string;
  order: { orderNumber: string; status: string; phone: string };
}

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function update(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast.success("Avis mis à jour.");
      await load();
    } else toast.error("Échec de la mise à jour.");
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Avis supprimé.");
      await load();
    } else toast.error("Échec de la suppression.");
  }

  function copyLink(token: string) {
    const origin = window.location.origin;
    navigator.clipboard.writeText(`${origin}/review/${token}`);
    toast.success("Lien d'avis copié.");
  }

  const inputCls =
    "bg-white border border-input rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--primary)]">Avis clients</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Un seul avis par commande livrée. Approuvez un avis pour l&apos;afficher sur la fiche produit.
      </p>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-luxe">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-luxe">
            <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun avis pour le moment. Depuis une commande livrée, cliquez « Demander un avis (WhatsApp) » pour en recevoir.
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-border p-5 shadow-luxe">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[var(--primary)]">
                      {r.customerName} <span className="font-normal text-muted-foreground">— {r.wilayaName}</span>
                    </p>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {r.order.orderNumber}
                    </span>
                    {!r.submitted && (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">En attente du client</span>
                    )}
                    {r.submitted && r.approved && (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Publié</span>
                    )}
                    {r.submitted && !r.approved && (
                      <span className="text-[11px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">Masqué</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 mt-1.5" aria-label={`${r.rating}/5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn("h-3.5 w-3.5", n <= r.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  {r.text && <p className="mt-2 text-sm text-foreground/80">{r.text}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {!r.submitted && (
                    <button onClick={() => copyLink(r.token)} className="inline-flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-2 rounded-xl hover:bg-muted">
                      <Copy className="h-3.5 w-3.5" /> Copier le lien
                    </button>
                  )}
                  {r.submitted && !r.approved && (
                    <button onClick={() => update(r.id, { approved: true })} className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700">
                      <Check className="h-3.5 w-3.5" /> Approuver
                    </button>
                  )}
                  {r.submitted && r.approved && (
                    <button onClick={() => update(r.id, { approved: false })} className="inline-flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-2 rounded-xl hover:bg-muted">
                      <EyeOff className="h-3.5 w-3.5" /> Masquer
                    </button>
                  )}
                  <button onClick={() => remove(r.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Le lien d&apos;avis est à usage unique : une fois le formulaire envoyé par le client, il ne peut plus être réutilisé.
      </p>
      <span className={inputCls + " hidden"} />
    </div>
  );
}
