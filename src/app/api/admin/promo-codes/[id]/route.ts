import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("promo");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const value = parseFloat(String(body.value));
    if (isNaN(value) || value <= 0) return NextResponse.json({ error: "Enter a valid discount value." }, { status: 400 });
    const promoCode = await db.promoCode.update({
      where: { id },
      data: {
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
    return NextResponse.json({ error: "Could not update the promo code." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("promo");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!canDelete(guard.session.role, "promo")) {
    return NextResponse.json({ error: "You do not have permission to delete promo codes." }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await db.promoCode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the promo code." }, { status: 500 });
  }
}
