import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/promo/validate { code, subtotal }
export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code?.trim()) return NextResponse.json({ valid: false, error: "Enter a promo code." }, { status: 400 });

    const promo = await db.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
    const now = new Date();

    if (!promo || !promo.active) {
      return NextResponse.json({ valid: false, error: "This promo code does not exist." });
    }
    if (promo.expiresAt && promo.expiresAt < now) {
      return NextResponse.json({ valid: false, error: "This promo code has expired." });
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ valid: false, error: "This promo code has reached its usage limit." });
    }
    if (subtotal < promo.minOrder) {
      return NextResponse.json({ valid: false, error: `Minimum order of $${promo.minOrder} required for this code.` });
    }

    const discount =
      promo.type === "PERCENT"
        ? Math.round(subtotal * (promo.value / 100) * 100) / 100
        : Math.min(promo.value, subtotal);

    return NextResponse.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discount,
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Could not validate the code." }, { status: 500 });
  }
}
