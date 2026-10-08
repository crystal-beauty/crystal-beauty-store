import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";
import { getSettings, SECRET_SETTING_KEYS } from "@/lib/settings";
import SettingsManager from "@/components/admin/settings-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paramètres" };

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || !canAccess(session.role, "settings")) redirect("/admin");
  const settings = await getSettings();
  // Secrets never reach the browser — masked values are ignored on save
  const initial = { ...settings } as Record<string, unknown>;
  for (const key of SECRET_SETTING_KEYS) {
    initial[key] = initial[key] ? "••••••••" : "";
  }
  return <SettingsManager initial={initial as Record<string, string | number | boolean>} />;
}
