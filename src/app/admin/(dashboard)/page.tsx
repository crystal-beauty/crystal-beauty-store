import Link from "next/link";
import { db } from "@/lib/db";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TicketPercent,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatMoney, STATUS_STYLES } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const settings = await getSettings();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revenue, totalOrders, pendingOrders, productCount, activePromos, monthAgg, recentOrders, topProducts, lowStock] =
    await Promise.all([
      db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
      db.order.count(),
      db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
      db.product.count(),
      db.promoCode.count({ where: { active: true } }),
      db.order.aggregate({
        where: { status: { not: "CANCELLED" }, createdAt: { gte: monthStart } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      db.orderItem.groupBy({
        by: ["productId", "productName"],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      db.product.findMany({ where: { trackStock: true, stock: { lte: 3 } }, select: { id: true, name: true, stock: true } }),
    ]);

  const cards = [
    {
      label: "Total Revenue",
      value: formatMoney(revenue._sum.total || 0, settings),
      sub: `${formatMoney(monthAgg._sum.total || 0, settings)} this month`,
      icon: DollarSign,
    },
    {
      label: "Total Orders",
      value: String(totalOrders),
      sub: `${monthAgg._count._all} this month`,
      icon: ShoppingCart,
    },
    {
      label: "Awaiting Action",
      value: String(pendingOrders),
      sub: "Pending or confirmed orders",
      icon: AlertTriangle,
    },
    {
      label: "Products & Promos",
      value: `${productCount} / ${activePromos}`,
      sub: "Active products / promo codes",
      icon: Package,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Welcome back 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here&apos;s how your gift store is doing today.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Package className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-border p-5 shadow-luxe">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className="h-9 w-9 rounded-xl bg-[var(--primary)]/5 flex items-center justify-center">
                <card.icon className="h-4.5 w-4.5 text-[var(--gold)]" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--primary)]">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-luxe">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-[var(--gold)] hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-10 text-center">
              No orders yet. Share your store link to get the first one!
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--primary)]">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.customerName} · {order.city}, {order.country} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status] || ""}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-[var(--primary)] hidden sm:block">
                      {formatMoney(order.total, settings)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top products + low stock */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-luxe">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display text-lg font-semibold text-[var(--primary)] flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-[var(--gold)]" /> Top Sellers
              </h2>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground px-5 py-8 text-center">No sales data yet.</p>
            ) : (
              <div className="px-5 py-3 divide-y divide-border">
                {topProducts.map((t) => (
                  <div key={t.productId} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--primary)] truncate">{t.productName}</p>
                      <span className="text-sm font-bold text-[var(--gold)] shrink-0">×{t._sum.quantity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatMoney(t._sum.lineTotal || 0, settings)} earned</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lowStock.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Low Stock Alert
              </h2>
              <ul className="mt-3 space-y-1.5">
                {lowStock.map((p) => (
                  <li key={p.id} className="text-sm text-amber-800 flex justify-between gap-3">
                    <span className="truncate">{p.name}</span>
                    <span className="font-semibold shrink-0">{p.stock} left</span>
                  </li>
                ))}
              </ul>
              <Link href="/admin/products" className="mt-3 inline-block text-xs font-medium text-amber-800 underline">
                Manage inventory
              </Link>
            </div>
          )}

          <div className="rounded-2xl bg-[var(--primary)] text-white p-5">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <TicketPercent className="h-4.5 w-4.5 text-[var(--gold)]" /> {activePromos} Active Promos
            </h2>
            <p className="text-sm text-white/70 mt-1.5">Run a seasonal campaign to boost gifting.</p>
            <Link
              href="/admin/promo-codes"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--gold)] hover:underline"
            >
              Create promo code <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
