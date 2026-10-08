import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { relayMetaEvent } from "@/lib/capi";

// Meta Pixel server relay (Conversions API) — mirrors browser events with same event_id
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventId, customData, userData, eventSourceUrl } = body || {};
    if (!eventName) return NextResponse.json({ error: "eventName required" }, { status: 400 });

    const settings = await getSettings();
    if (!settings.metaPixelEnabled) {
      // Still log for the admin events feed (without forwarding)
      await relayMetaEvent({ eventName, eventId, customData, userData, eventSourceUrl, source: "browser" }, settings);
      return NextResponse.json({ ok: true, forwarded: false });
    }
    const result = await relayMetaEvent({ eventName, eventId, customData, userData, eventSourceUrl, source: "browser" }, settings);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
