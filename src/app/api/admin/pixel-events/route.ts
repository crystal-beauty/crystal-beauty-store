import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

// GET /api/admin/pixel-events — last 200 events for the admin feed
export async function GET() {
  const guard = await requireApiSession("pixel");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const events = await db.pixelEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const counts = await db.pixelEvent.groupBy({ by: ["eventName"], _count: { _all: true } });
  return NextResponse.json({
    events,
    counts: counts.map((c) => ({ eventName: c.eventName, count: c._count._all })),
  });
}

// DELETE /api/admin/pixel-events — clear the log
export async function DELETE() {
  const guard = await requireApiSession("pixel");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  await db.pixelEvent.deleteMany({});
  return NextResponse.json({ ok: true });
}
