import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

// GET /api/shipping/rates?country=UAE&city=Dubai&subtotal=100
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country")?.trim() || "";
    const city = searchParams.get("city")?.trim() || "";
    const subtotal = parseFloat(searchParams.get("subtotal") || "0") || 0;
    const settings = await getSettings();

    const rates = await db.shippingRate.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });

    // Match priority: city+country > country > worldwide(*)
    const matching = rates.filter((r) => {
      if (r.city && city) {
        return r.city.toLowerCase() === city.toLowerCase() && r.country.toLowerCase() === country.toLowerCase();
      }
      return false;
    });
    const byCountry = rates.filter(
      (r) => !r.city && r.country !== "*" && r.country.toLowerCase() === country.toLowerCase()
    );
    const worldwide = rates.filter((r) => r.country === "*" && !r.city);

    const seen = new Set<string>();
    const final = [...matching, ...byCountry, ...worldwide].filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    const freeOverApplied = final.map((r) => {
      const threshold = r.freeOver ?? settings.freeShippingThreshold;
      const isFree = threshold > 0 && subtotal >= threshold;
      return { ...r, price: isFree ? 0 : r.price, isFree };
    });

    return NextResponse.json({ rates: freeOverApplied });
  } catch {
    return NextResponse.json({ rates: [] });
  }
}
