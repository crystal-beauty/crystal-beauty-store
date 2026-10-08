"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Phone, MessageCircle, Truck, Printer, XCircle, CheckCircle2, Loader2, AlertTriangle,
  Gift, Banknote, MapPin, Building, ChevronDown, Star,
} from "lucide-react";
import { formatMoney, ORDER_STATUSES, STATUS_LABELS, STATUS_STYLES, toInternationalDz } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  email: string | null;
  phone: string;
  wilayaId: number | null;
  wilayaName: string;
  commune: string;
  address: string;
  deliveryType: string;
  stopDeskName: string | null;
  notes: string | null;
  giftMessage: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  giftBoxFee: number;
  total: number;
  promoCodeStr: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  carrierStatus: string | null;
  globalStatus: string | null;
  shipmentResponse: string | null;
  reviewRequestedAt: string | null;
  createdAt: string;
  items: { productName: string; productImage: string; variantSelections: string; quantity: number; unitPrice: number; lineTotal: number; giftBox: boolean }[];
}

export default function OrderDetail({ order, canDelete, refusedWarning }: { order: OrderData; canDelete: boolean; refusedWarning: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);
  const [reviewLink, setReviewLink] = useState<string>("");

  const waNumber = order.recipientPhone || order.phone;
  const waText = encodeURIComponent(`Bonjour ${order.customerName}, nous vous contactons au sujet de votre commande ${order.orderNumber}. / مرحبًا ${order.customerName}، نتصل بك بخصوص طلبك ${order.orderNumber}.`);

  async function updateStatus(status: string) {
    setBusy(`status-${status}`);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Statut → ${STATUS_LABELS[status]}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la mise à jour.");
    } finally {
      setBusy("");
    }
  }

  async function sendToCarrier() {
    setBusy("ship");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/ship`, { method: "POST" });
      const data = await res.json();
      if (!res.ok && !data.order) throw new Error(data.error || "Échec.");
      if (res.ok) toast.success(`Colis créé — suivi: ${data.trackingNumber}`, { duration: 8000 });
      else toast.error(data.error, { duration: 10000 });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'envoi au transporteur.");
    } finally {
      setBusy("");
    }
  }

  async function cancelOrder() {
    if (!confirm("Annuler cette commande ? Le colis sera également supprimé chez le transporteur s'il existe.")) return;
    setBusy("cancel");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/cancel-parcel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok && res.status !== 207) throw new Error(data.error || "Échec.");
      if (res.status === 207) toast.warning(data.error, { duration: 10000 });
      else toast.success("Commande annulée.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'annulation.");
    } finally {
      setBusy("");
    }
  }

  async function requestReview() {
    setBusy("review");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/request-review`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec.");
      setReviewLink(data.waLink);
      window.open(data.waLink, "_blank");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la demande d'avis.");
    } finally {
      setBusy("");
    }
  }

  async function deleteOrder() {
    if (!confirm("Supprimer définitivement cette commande ?")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Échec.");
      }
      toast.success("Commande supprimée.");
      router.push("/admin/orders");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la suppression.");
    } finally {
      setBusy("");
    }
  }

  const cardCls = "bg-white rounded-2xl border border-border p-5 shadow-luxe";
  const btnBase = "inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50";

  let parsedResponse: Record<string, unknown> | null = null;
  try {
    parsedResponse = order.shipmentResponse ? JSON.parse(order.shipmentResponse) : null;
  } catch {
    parsedResponse = { raw: order.shipmentResponse };
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-semibold text-[var(--primary)]" dir="ltr">
              {order.orderNumber}
            </h1>
            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border", STATUS_STYLES[order.status])}>{STATUS_LABELS[order.status]}</span>
            {refusedWarning && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" /> Refus/retour précédent sur ce numéro
              </span>
            )}
            {parsedResponse?.pending === true && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin" /> Réservation en cours…
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleString("fr-FR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={Boolean(busy)}
            className="bg-white border border-input rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
            aria-label="Changer le statut"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className={cardCls + " flex flex-wrap gap-2.5"}>
        <a href={`tel:${order.phone}`} className={cn(btnBase, "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90")}>
          <Phone className="h-4 w-4" /> Appeler le client
        </a>
        <a
          href={`https://wa.me/${toInternationalDz(waNumber).replace("+", "")}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(btnBase, "bg-[#25D366] text-white hover:bg-[#1fb857]")}
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        {["NEW", "CONFIRMED"].includes(order.status) && (
          <button onClick={sendToCarrier} disabled={Boolean(busy)} className={cn(btnBase, "bg-[var(--gold)] text-white hover:bg-[#b8903a]")}>
            {busy === "ship" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Envoyer au transporteur
          </button>
        )}
        <a href={`/admin/orders/${order.id}/label`} target="_blank" className={cn(btnBase, "border border-border hover:bg-muted")}>
          <Printer className="h-4 w-4" /> Imprimer l'étiquette
        </a>
        {order.status === "DELIVERED" && (
          <button onClick={requestReview} disabled={Boolean(busy)} className={cn(btnBase, "bg-emerald-600 text-white hover:bg-emerald-700")}>
            {busy === "review" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            {order.reviewRequestedAt ? "Renvoyer la demande d'avis" : "Demander un avis (WhatsApp)"}
          </button>
        )}
        <button onClick={cancelOrder} disabled={Boolean(busy) || order.status === "CANCELLED"} className={cn(btnBase, "border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40")}>
          {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Annuler
        </button>
        {canDelete && (
          <button onClick={deleteOrder} disabled={Boolean(busy)} className={cn(btnBase, "text-rose-600 hover:bg-rose-50 ms-auto")}>
            Supprimer
          </button>
        )}
      </div>

      {reviewLink && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 break-all">
          Lien de demande d'avis ouvert dans WhatsApp. Lien direct :{" "}
          <a href={reviewLink} target="_blank" rel="noopener noreferrer" className="underline font-medium">
            ouvrir à nouveau
          </a>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Customer + delivery */}
        <div className="space-y-5">
          <div className={cardCls}>
            <h2 className="font-semibold text-[var(--primary)] mb-3">Client</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Nom :</span> <span className="font-medium">{order.customerName}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Téléphone :</span>{" "}
                <a href={`tel:${order.phone}`} className="font-medium hover:underline" dir="ltr">
                  {order.phone}
                </a>
              </p>
              {order.email && (
                <p>
                  <span className="text-muted-foreground">Email :</span> <span className="font-medium">{order.email}</span>
                </p>
              )}
              {order.recipientName && (
                <p className="flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-[var(--gold)]" />
                  <span className="text-muted-foreground">Destinataire :</span>
                  <span className="font-medium">
                    {order.recipientName} {order.recipientPhone ? `(${order.recipientPhone})` : ""}
                  </span>
                </p>
              )}
              {order.giftMessage && (
                <p className="rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/25 px-3 py-2">
                  <span className="text-muted-foreground">Message cadeau :</span> <em>{order.giftMessage}</em>
                </p>
              )}
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="font-semibold text-[var(--primary)] mb-3 flex items-center gap-2">
              {order.deliveryType === "STOP_DESK" ? <Building className="h-4 w-4 text-[var(--gold)]" /> : <MapPin className="h-4 w-4 text-[var(--gold)]" />}
              Livraison — {order.deliveryType === "STOP_DESK" ? "Stop desk" : "Domicile"}
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Wilaya :</span> <span className="font-medium">{order.wilayaName}</span>
                {order.wilayaId ? <span className="text-muted-foreground"> (code {order.wilayaId})</span> : null}
              </p>
              <p>
                <span className="text-muted-foreground">Commune :</span> <span className="font-medium">{order.commune}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Adresse :</span> <span className="font-medium">{order.address}</span>
                <span className="text-xs text-muted-foreground"> ({order.address.length}/30)</span>
              </p>
              {order.notes && (
                <p>
                  <span className="text-muted-foreground">Note client :</span> <em>{order.notes}</em>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items + totals */}
        <div className="space-y-5">
          <div className={cardCls}>
            <h2 className="font-semibold text-[var(--primary)] mb-3">Articles</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--primary)] truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variantSelections !== "{}" && Object.values(JSON.parse(item.variantSelections || "{}")).join(" · ")}
                      {item.giftBox && " · Boîte cadeau"}
                    </p>
                  </div>
                  <div className="text-end text-sm whitespace-nowrap">
                    <p className="font-semibold text-[var(--primary)]">{formatMoney(item.lineTotal)}</p>
                    <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Remise {order.promoCodeStr && `(${order.promoCodeStr})`}</span>
                  <span>-{formatMoney(order.discount)}</span>
                </div>
              )}
              {order.giftBoxFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Boîtes cadeau</span>
                  <span>{formatMoney(order.giftBoxFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Frais de livraison (tarif transporteur)</span>
                <span>{formatMoney(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2.5 font-semibold text-[var(--primary)]">
                <span className="flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-[var(--gold)]" /> À encaisser (COD)
                </span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Carrier */}
          <div className={cardCls}>
            <h2 className="font-semibold text-[var(--primary)] mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-[var(--gold)]" /> Transporteur — {order.carrier || "non envoyé"}
            </h2>
            {order.trackingNumber ? (
              <div className="space-y-2 text-sm" dir="ltr">
                <p>
                  <span className="text-muted-foreground">Suivi :</span> <span className="font-mono font-medium">{order.trackingNumber}</span>
                </p>
                {order.carrierStatus && (
                  <p>
                    <span className="text-muted-foreground">Statut brut :</span> <span className="font-mono">{order.carrierStatus}</span>
                    {order.globalStatus ? ` · ${order.globalStatus}` : ""}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pas encore envoyé au transporteur.</p>
            )}
            {parsedResponse && (
              <div className="mt-3">
                <button onClick={() => setShowRaw(!showRaw)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-[var(--primary)]">
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showRaw && "rotate-180")} /> Réponse API transporteur
                </button>
                {showRaw && (
                  <pre className="mt-2 rounded-xl bg-muted p-3 text-[11px] overflow-x-auto scrollbar-thin" dir="ltr">
                    {JSON.stringify(parsedResponse, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
