import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/promo/validate { code, subtotal } — DZD, whole numbers
export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code?.trim()) return NextResponse.json({ valid: false, error: "Entrez un code promo." }, { status: 400 });

    const promo = await db.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
    const now = new Date();

    if (!promo || !promo.active) {
      return NextResponse.json({ valid: false, error: "Ce code promo n'existe pas." });
    }
    if (promo.expiresAt && promo.expiresAt < now) {
      return NextResponse.json({ valid: false, error: "Ce code promo a expiré." });
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ valid: false, error: "Ce code promo a atteint sa limite d'utilisation." });
    }
    if (subtotal < promo.minOrder) {
      return NextResponse.json({ valid: false, error: `Minimum de commande : ${Math.round(promo.minOrder)} DA pour ce code.` });
    }

    const discount =
      promo.type === "PERCENT"
        ? Math.round(subtotal * (promo.value / 100))
        : Math.min(Math.round(promo.value), subtotal);

    return NextResponse.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discount,
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Impossible de valider le code." }, { status: 500 });
  }
}
