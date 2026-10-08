import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

// GET /api/admin/stats — COD dashboard overview
export async function GET() {
  const guard = await requireApiSession("overview");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const [newOrders, toConfirm, inDelivery, deliveredAgg, deliveredCount, refusedCount, returnedCount, cancelledCount, totalOrders, products, lowStockProducts, byWilaya, recentOrders] =
    await Promise.all([
      db.order.count({ where: { status: "NEW" } }),
      db.order.count({ where: { status: "CONFIRMED" } }),
      db.order.count({ where: { status: { in: ["SENT_TO_CARRIER", "IN_DELIVERY"] } } }),
      db.order.aggregate({ where: { status: "DELIVERED" }, _sum: { total: true } }),
      db.order.count({ where: { status: "DELIVERED" } }),
      db.order.count({ where: { status: "REFUSED" } }),
      db.order.count({ where: { status: "RETURNED" } }),
      db.order.count({ where: { status: "CANCELLED" } }),
      db.order.count(),
      db.product.count(),
      db.product.findMany({ where: { trackStock: true, stock: { lte: 3 } }, select: { id: true, name: true, stock: true } }),
      db.order.groupBy({
        by: ["wilayaName"],
        _count: { _all: true },
        _sum: { total: true },
        orderBy: { _count: { wilayaName: "desc" } },
        take: 10,
      }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
    ]);

  const finalized = deliveredCount + refusedCount + returnedCount;
  const refusalRate = finalized > 0 ? Math.round((refusedCount / finalized) * 100) : 0;

  return NextResponse.json({
    stats: {
      newOrders,
      toConfirm,
      inDelivery,
      deliveredRevenue: deliveredAgg._sum.total || 0,
      deliveredCount,
      refusedCount,
      returnedCount,
      cancelledCount,
      totalOrders,
      refusalRate,
      totalProducts: products,
      lowStockProducts,
      ordersByWilaya: byWilaya.map((w) => ({ wilayaName: w.wilayaName, count: w._count._all, revenue: w._sum.total || 0 })),
    },
    recentOrders,
  });
}
