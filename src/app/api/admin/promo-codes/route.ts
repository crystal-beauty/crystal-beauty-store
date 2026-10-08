import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

export async function GET() {
  const guard = await requireApiSession("promo");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const promoCodes = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promoCodes });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession("promo");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const value = parseFloat(String(body.value));
    if (!code) return NextResponse.json({ error: "Promo code is required." }, { status: 400 });
    if (isNaN(value) || value <= 0) return NextResponse.json({ error: "Enter a valid discount value." }, { status: 400 });

    const exists = await db.promoCode.findUnique({ where: { code } });
    if (exists) return NextResponse.json({ error: "This code already exists." }, { status: 400 });

    const promoCode = await db.promoCode.create({
      data: {
        code,
        type: body.type === "FIXED" ? "FIXED" : "PERCENT",
        value,
        minOrder: parseFloat(String(body.minOrder ?? 0)) || 0,
        maxUses: body.maxUses ? parseInt(String(body.maxUses)) || null : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        active: body.active !== false,
      },
    });
    return NextResponse.json({ promoCode });
  } catch {
    return NextResponse.json({ error: "Could not create the promo code." }, { status: 500 });
  }
}
