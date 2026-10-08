import crypto from "node:crypto";
import { db } from "@/lib/db";
import type { StoreSettings } from "@/lib/settings";

/**
 * Meta Conversions API relay.
 * Logs every event to the DB, and (when configured) forwards it to Meta's
 * Graph API with event_id deduplication matching the browser pixel.
 */

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface TrackInput {
  eventName: string;
  eventId?: string;
  customData?: Record<string, unknown>;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
  };
  eventSourceUrl?: string;
  source?: "browser" | "server";
}

export async function relayMetaEvent(input: TrackInput, settings: StoreSettings): Promise<{ logged: boolean; forwarded: boolean }> {
  const eventId = input.eventId || `srv_${crypto.randomBytes(8).toString("hex")}`;

  let forwarded = false;
  const shouldForward =
    settings.metaPixelEnabled &&
    Boolean(settings.metaPixelId) &&
    Boolean(settings.metaCapiToken);

  if (shouldForward) {
    const user_data: Record<string, string> = {};
    if (input.userData?.email) user_data.em = sha256(input.userData.email);
    if (input.userData?.phone) user_data.ph = sha256(input.userData.phone.replace(/[^\d+]/g, ""));
    if (input.userData?.firstName) user_data.fn = sha256(input.userData.firstName);
    if (input.userData?.lastName) user_data.ln = sha256(input.userData.lastName);
    if (input.userData?.city) user_data.ct = sha256(input.userData.city);
    if (input.userData?.country) user_data.country = sha256(input.userData.country);

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: input.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: input.eventSourceUrl,
          user_data,
          custom_data: input.customData || {},
        },
      ],
      access_token: settings.metaCapiToken,
    };
    if (settings.metaTestEventCode) payload.test_event_code = settings.metaTestEventCode;

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${settings.metaPixelId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      forwarded = res.ok;
    } catch {
      forwarded = false;
    }
  }

  try {
    await db.pixelEvent.create({
      data: {
        eventName: input.eventName,
        eventId,
        payload: JSON.stringify({ customData: input.customData || {}, userData: Object.keys(input.userData || {}).length ? input.userData : undefined }),
        source: input.source || "browser",
        forwarded,
      },
    });
  } catch {
    // never throw from tracking
  }

  return { logged: true, forwarded };
}
