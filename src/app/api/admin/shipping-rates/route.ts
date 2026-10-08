import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

export async function GET() {
  const guard = await requireApiSession("shipping");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const rates = await db.shippingRate.findMany({ orderBy: [{ sortOrder: "asc" }, { country: "asc" }] });
  return NextResponse.json({ rates });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession("shipping");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await req.json();
    const price = parseFloat(String(body.price));
    if (!body.name?.trim() || isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Method name and a valid price are required." }, { status: 400 });
    }
    const rate = await db.shippingRate.create({
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
    return NextResponse.json({ error: "Could not create the shipping rate." }, { status: 500 });
  }
}
