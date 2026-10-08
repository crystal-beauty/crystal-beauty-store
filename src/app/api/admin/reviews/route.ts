import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

// GET /api/admin/reviews
export async function GET() {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const reviews = await db.review.findMany({
    include: { order: { select: { orderNumber: true, status: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ reviews });
}
