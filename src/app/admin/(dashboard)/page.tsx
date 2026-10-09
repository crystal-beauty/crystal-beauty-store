import Link from "next/link";
import { db } from "@/lib/db";
import {
  ShoppingCart,
  Package,
  PhoneCall,
  Truck,
  Ban,
  Banknote,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatMoney, STATUS_LABELS, STATUS_STYLES } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vue d'ensemble" };

export default async function AdminOverviewPage() {
  const [newOrders, toConfirm, inDelivery, deliveredAgg, deliveredCount, refusedCount, totalOrders, lowStock, recentOrders, byWilaya] =
    await Promise.all([
      db.order.count({ where: { status: "NEW" } }),
      db.order.count({ where: { status: "CONFIRMED" } }),
      db.order.count({ where: { status: { in: ["SENT_TO_CARRIER", "IN_DELIVERY"] } } }),
      db.order.aggregate({ where: { status: "DELIVERED" }, _sum: { total: true } }),
      db.order.count({ where: { status: "DELIVERED" } }),
      db.order.count({ where: { status: "REFUSED" } }),
      db.order.count(),
      db.product.findMany({ where: { trackStock: true, stock: { lte: 3 } }, select: { id: true, name: true, stock: true } }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      db.order.groupBy({
        by: ["wilayaName"],
        _count: { _all: true },
        orderBy: { _count: { wilayaName: "desc" } },
        take: 6,
      }),
    ]);

  const deliveredRevenue = deliveredAgg._sum.total || 0;
  const finalized = deliveredCount + refusedCount;
  const refusalRate = finalized > 0 ? Math.round((refusedCount / finalized) * 100) : 0;
  const productCount = await db.product.count();

  const cards = [
    { label: "Nouvelles commandes", value: String(newOrders), sub: "À appeler pour confirmer", icon: ShoppingCart, href: "/admin/orders?status=NEW" },
    { label: "À confirmer", value: String(toConfirm), sub: "Confirmées, à préparer", icon: PhoneCall, href: "/admin/orders?status=CONFIRMED" },
    { label: "En livraison", value: String(inDelivery), sub: "Chez le transporteur", icon: Truck, href: "/admin/orders?status=IN_DELIVERY" },
    { label: "CA encaissé (livré)", value: formatMoney(deliveredRevenue), sub: `${deliveredCount} commande(s) livrée(s)`, icon: Banknote, href: "/admin/orders?status=DELIVERED" },
    { label: "Taux de refus", value: `${refusalRate}%`, sub: `${refusedCount} refus(s) sur ${finalized} finalisée(s)`, icon: Ban, href: "/admin/orders?status=REFUSED" },
    { label: "Commandes totales", value: String(totalOrders), sub: "Depuis le début", icon: TrendingUp, href: "/admin/orders" },
    { label: "Produits", value: String(productCount), sub: productCount === 0 ? "Catalogue vide — ajoutez vos produits" : "Au catalogue", icon: Package, href: "/admin/products" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Vue d&apos;ensemble</h1>
          <p className="text-sm text-muted-foreground mt-1">Paiement à la livraison — partout en Algérie.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Package className="h-4 w-4" /> Ajouter un produit
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white rounded-2xl border border-border p-5 shadow-luxe hover:border-[var(--brand)]/50 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className="h-9 w-9 rounded-xl bg-[var(--primary)]/5 flex items-center justify-center">
                <card.icon className="h-4.5 w-4.5 text-[var(--brand)]" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--primary)]">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-luxe">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)]">Dernières commandes</h2>
            <Link href="/admin/orders" className="text-sm text-[var(--brand)] hover:underline inline-flex items-center gap-1">
              Tout voir <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-10 text-center">
              Aucune commande pour le moment. Partagez le lien de la boutique pour recevoir la première !
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--primary)]" dir="ltr">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.customerName} · {order.commune}, {order.wilayaName} · {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border", STATUS_STYLES[order.status] || "")}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="text-sm font-semibold text-[var(--primary)] hidden sm:block">{formatMoney(order.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* By wilaya + low stock */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-luxe">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display text-lg font-semibold text-[var(--primary)] flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-[var(--brand)]" /> Commandes par wilaya
              </h2>
            </div>
            {byWilaya.length === 0 ? (
              <p className="text-sm text-muted-foreground px-5 py-8 text-center">Pas encore de données.</p>
            ) : (
              <div className="px-5 py-3 divide-y divide-border">
                {byWilaya.map((w) => (
                  <div key={w.wilayaName} className="py-2.5 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--primary)] truncate">{w.wilayaName}</p>
                    <span className="text-sm font-bold text-[var(--brand)] shrink-0">{w._count._all}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lowStock.length > 0 && (
            <div className="rounded-2xl border border-[#d7deea] bg-[#eef1f6] p-5">
              <h2 className="text-sm font-semibold text-[#0a1f44] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Stock faible
              </h2>
              <ul className="mt-3 space-y-1.5">
                {lowStock.map((p) => (
                  <li key={p.id} className="text-sm text-[#0a1f44] flex justify-between gap-3">
                    <span className="truncate">{p.name}</span>
                    <span className="font-semibold shrink-0">{p.stock} restant</span>
                  </li>
                ))}
              </ul>
              <Link href="/admin/products" className="mt-3 inline-block text-xs font-medium text-[#0a1f44] underline">
                Gérer le stock
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
