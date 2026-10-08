import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

// GET /api/admin/stats — dashboard overview
export async function GET() {
  const guard = await requireApiSession("overview");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [orders, totalOrders, pendingOrders, products, lowStockProducts, monthOrders, promos, recentOrders, topProducts] =
    await Promise.all([
      db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
      db.order.count(),
      db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
      db.product.count(),
      db.product.findMany({ where: { trackStock: true, stock: { lte: 3 } }, select: { id: true, name: true, stock: true } }),
      db.order.aggregate({
        where: { status: { not: "CANCELLED" }, createdAt: { gte: monthStart } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      db.promoCode.count({ where: { active: true } }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
      db.orderItem.groupBy({
        by: ["productId", "productName"],
        _sum: { quantity: true, lineTotal: true },
        _count: { _all: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  return NextResponse.json({
    stats: {
      totalRevenue: orders._sum.total || 0,
      totalOrders,
      pendingOrders,
      totalProducts: products,
      activePromos: promos,
      monthRevenue: monthOrders._sum.total || 0,
      monthOrders: monthOrders._count._all,
      lowStockProducts,
    },
    recentOrders,
    topProducts: topProducts.map((t) => ({
      productId: t.productId,
      name: t.productName,
      quantity: t._sum.quantity || 0,
      revenue: t._sum.lineTotal || 0,
    })),
  });
}
