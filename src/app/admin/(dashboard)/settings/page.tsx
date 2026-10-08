import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import SettingsManager from "@/components/admin/settings-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store Settings" };

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || !canAccess(session.role, "settings")) redirect("/admin");
  const settings = await getSettings();
  return <SettingsManager initial={settings} />;
}
