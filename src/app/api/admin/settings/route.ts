import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";

export async function GET() {
  const guard = await requireApiSession("settings");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const guard = await requireApiSession("settings");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await req.json();
    const settings = await saveSettings(body);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}
