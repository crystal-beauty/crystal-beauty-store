import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/review { token, rating, text }
 * One-time submit — the token becomes unusable after this call.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, rating, text } = (await req.json()) as { token?: string; rating?: number; text?: string };
    if (!token) return NextResponse.json({ error: "Invalid link." }, { status: 400 });

    const review = await db.review.findUnique({ where: { token } });
    if (!review || review.submitted) {
      return NextResponse.json({ error: "Invalid or already-used review link." }, { status: 404 });
    }

    const safeRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));

    await db.review.update({
      where: { token },
      data: {
        rating: safeRating,
        text: (text || "").slice(0, 1000),
        submitted: true,
        // stays hidden until the admin approves it
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not submit the review." }, { status: 500 });
  }
}
