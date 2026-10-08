import { NextResponse } from "next/server";
import { getFees } from "@/lib/carrier";
import { WILAYAS } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * GET /api/delivery/wilayas
 * Live wilaya list from the carrier fee table (never a local price table).
 * Wilayas missing from the carrier response are NOT offered at checkout.
 */
export async function GET() {
  try {
    const fees = await getFees();
    const wilayas = fees
      .map((f) => {
        const meta = WILAYAS.find((w) => w.id === f.wilaya_id);
        return {
          id: f.wilaya_id,
          fr: meta?.fr || `Wilaya ${f.wilaya_id}`,
          ar: meta?.ar || `ولاية ${f.wilaya_id}`,
          homeFee: f.tarif,
          stopDeskFee: f.tarif_stopdesk,
        };
      })
      .sort((a, b) => a.id - b.id);
    return NextResponse.json({ wilayas });
  } catch {
    return NextResponse.json({ error: "CARRIER_UNAVAILABLE" }, { status: 502 });
  }
}
