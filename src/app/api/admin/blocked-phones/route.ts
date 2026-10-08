import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { normalizeDzPhone } from "@/lib/format";

// GET /api/admin/blocked-phones
export async function GET() {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const phones = await db.blockedPhone.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ phones });
}

// POST /api/admin/blocked-phones { phone, reason }
export async function POST(req: NextRequest) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { phone, reason } = (await req.json()) as { phone?: string; reason?: string };
  const normalized = normalizeDzPhone(String(phone || ""));
  if (!/^0(5|6|7)\d{8}$/.test(normalized)) {
    return NextResponse.json({ error: "Invalid Algerian mobile (05/06/07, 10 digits)." }, { status: 400 });
  }
  const blocked = await db.blockedPhone.upsert({
    where: { phone: normalized },
    update: { reason: reason?.trim() || null, active: true },
    create: { phone: normalized, reason: reason?.trim() || null },
  });
  return NextResponse.json({ blocked });
}
