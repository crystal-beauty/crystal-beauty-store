import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("shipping");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const price = parseFloat(String(body.price));
    if (!body.name?.trim() || isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Method name and a valid price are required." }, { status: 400 });
    }
    const rate = await db.shippingRate.update({
      where: { id },
      data: {
        name: String(body.name).trim(),
        carrier: body.carrier?.trim() || "World Express",
        country: body.country?.trim() || "*",
        city: body.city?.trim() || null,
        price,
        estimatedDays: body.estimatedDays?.trim() || "3-7",
        freeOver: body.freeOver ? parseFloat(String(body.freeOver)) || null : null,
        active: body.active !== false,
        sortOrder: parseInt(String(body.sortOrder ?? 0)) || 0,
      },
    });
    return NextResponse.json({ rate });
  } catch {
    return NextResponse.json({ error: "Could not update the shipping rate." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("shipping");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!canDelete(guard.session.role, "shipping")) {
    return NextResponse.json({ error: "You do not have permission to delete shipping rates." }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await db.shippingRate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the shipping rate." }, { status: 500 });
  }
}
