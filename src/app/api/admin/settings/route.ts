import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getSettings, saveSettings, SECRET_SETTING_KEYS } from "@/lib/settings";

export async function GET() {
  const guard = await requireApiSession("settings");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const settings = await getSettings();
  // Secret keys never leave the server
  const safe = { ...settings } as Record<string, unknown>;
  for (const key of SECRET_SETTING_KEYS) {
    safe[key] = safe[key] ? "••••••••" : "";
  }
  return NextResponse.json({ settings: safe });
}

export async function PUT(req: NextRequest) {
  const guard = await requireApiSession("settings");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    // Masked/empty secret values are ignored so they never overwrite stored keys
    const patch = { ...body };
    for (const key of SECRET_SETTING_KEYS) {
      const v = patch[key];
      if (typeof v !== "string" || v === "" || /^•+$/.test(v)) delete patch[key];
    }
    const settings = await saveSettings(patch);
    const safe = { ...settings } as Record<string, unknown>;
    for (const key of SECRET_SETTING_KEYS) {
      safe[key] = safe[key] ? "••••••••" : "";
    }
    return NextResponse.json({ settings: safe });
  } catch {
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}
