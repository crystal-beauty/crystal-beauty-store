import { NextRequest, NextResponse } from "next/server";
import { getCommunes } from "@/lib/carrier";

export const dynamic = "force-dynamic";

/**
 * GET /api/delivery/communes?wilaya_id=16
 * Live communes for a wilaya — exact carrier spelling + stop-desk availability.
 */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const wilayaId = parseInt(sp.get("wilaya_id") || sp.get("wilayaId") || "", 10);
  if (!wilayaId || wilayaId < 1 || wilayaId > 58) {
    return NextResponse.json({ error: "INVALID_WILAYA" }, { status: 400 });
  }
  try {
    const communes = await getCommunes(wilayaId);
    return NextResponse.json({ communes });
  } catch {
    return NextResponse.json({ error: "CARRIER_UNAVAILABLE" }, { status: 502 });
  }
}
