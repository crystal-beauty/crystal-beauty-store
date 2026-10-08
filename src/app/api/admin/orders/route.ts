import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

// GET /api/admin/orders?status=&search=&wilaya=&from=&to=
export async function GET(req: NextRequest) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();
  const wilaya = searchParams.get("wilaya");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const orders = await db.order.findMany({
    where: {
      ...(status && status !== "ALL" ? { status } : {}),
      ...(wilaya ? { wilayaName: { contains: wilaya } } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search.toUpperCase() } },
              { customerName: { contains: search } },
              { phone: { contains: search } },
              { trackingNumber: { contains: search } },
            ],
          }
        : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  // Warning: phone had earlier refused/returned orders
  const refusedPhones = new Set(
    (
      await db.order.findMany({
        where: { status: { in: ["REFUSED", "RETURNED"] } },
        select: { phone: true },
      })
    ).map((o) => o.phone.replace(/\D/g, "").slice(-9))
  );

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      refusedWarning: refusedPhones.has(o.phone.replace(/\D/g, "").slice(-9)),
    })),
  });
}
