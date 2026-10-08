"use client";

/**
 * Strong Meta Pixel structure:
 * - Browser pixel events with eventID deduplication
 * - Server-side relay to /api/track (Conversions API) with the same eventID
 */

type PixelUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
};

type PixelCustomData = {
  value?: number;
  currency?: string;
  contents?: { id: string; quantity: number; item_price?: number }[];
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  num_items?: number;
  order_id?: string;
  search_string?: string;
  [key: string]: unknown;
};

type WindowWithPixel = Window & {
  fbq?: (...args: unknown[]) => void;
  _fbq?: unknown;
};

export type PixelEventName =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "AddToWishlist"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Search"
  | "Contact"
  | "GiftBoxSelected";

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Fire a browser pixel event + mirror it to the server (CAPI relay) with the same event_id. */
export function trackPixel(
  eventName: PixelEventName,
  options: { customData?: PixelCustomData; userData?: PixelUserData; eventId?: string } = {}
): string {
  const eventId = options.eventId || newEventId();
  if (typeof window !== "undefined") {
    const w = window as WindowWithPixel;
    if (typeof w.fbq === "function") {
      try {
        w.fbq("track", eventName, options.customData || {}, { eventID: eventId });
      } catch {
        // pixel not ready — ignore
      }
    }
    // Server-side relay (Conversions API) — fire and forget
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          eventId,
          customData: options.customData || {},
          userData: options.userData || {},
          eventSourceUrl: window.location.href,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  }
  return eventId;
}
