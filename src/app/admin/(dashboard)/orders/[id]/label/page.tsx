import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import PrintButton from "@/components/admin/print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Étiquette" };

/**
 * Print sheet for the parcel. NOTE: the carrier docs do not provide a label
 * endpoint, so this is a locally printed sheet with all the info the driver /
 * stop desk needs (order ref, tracking, COD amount, addresses).
 */
export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [order, settings] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white border-2 border-[var(--primary)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--primary)] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-semibold">{settings.storeName}</p>
            {settings.contactPhone && <p className="text-xs text-white/70" dir="ltr">{settings.contactPhone}</p>}
          </div>
          <div className="text-end">
            <p className="text-xs text-white/70 uppercase tracking-wider">Cash on Delivery</p>
            <p className="text-2xl font-bold">{formatMoney(order.total)}</p>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-6 text-sm">
          {/* Recipient */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Destinataire</p>
            <p className="font-semibold text-[var(--primary)] text-base">{order.recipientName || order.customerName}</p>
            <p dir="ltr" className="font-medium">{order.recipientPhone || order.phone}</p>
            <p className="mt-2">
              {order.address}
              <br />
              {order.commune}, {order.wilayaName}
              {order.wilayaId ? <span className="text-muted-foreground"> ({order.wilayaId})</span> : null}
            </p>
            {order.deliveryType === "STOP_DESK" && (
              <p className="mt-2 inline-block bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/40 rounded-lg px-2.5 py-1 text-xs font-semibold">
                STOP DESK — {order.stopDeskName || order.commune}
              </p>
            )}
          </div>

          {/* Parcel */}
          <div className="sm:text-end">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Colis</p>
            <p>
              <span className="text-muted-foreground">Réf commande :</span>
              <br />
              <span className="font-mono font-bold text-base" dir="ltr">{order.orderNumber}</span>
            </p>
            {order.trackingNumber && (
              <p className="mt-2">
                <span className="text-muted-foreground">Suivi transporteur :</span>
                <br />
                <span className="font-mono font-bold" dir="ltr">{order.trackingNumber}</span>
              </p>
            )}
            <p className="mt-2 text-muted-foreground">
              {order.items.reduce((n, i) => n + i.quantity, 0)} article(s)
              {order.items.some((i) => i.giftBox) ? " · boîte cadeau" : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Produits : {order.items.map((i) => i.productName).join(", ").slice(0, 120)}</p>
          </div>
        </div>

        {order.notes && (
          <div className="px-6 pb-6">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Remarque livreur</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        <div className="border-t border-dashed border-border px-6 py-3 text-xs text-muted-foreground">
          Frais de livraison {formatMoney(order.deliveryFee)} — montant total à encaisser à la livraison : {formatMoney(order.total)}
        </div>
      </div>

      <PrintButton />
    </div>
  );
}
