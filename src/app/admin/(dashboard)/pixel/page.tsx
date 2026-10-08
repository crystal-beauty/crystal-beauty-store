import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import PixelCenter from "@/components/admin/pixel-center";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meta Pixel" };

export default async function AdminPixelPage() {
  const session = await getSession();
  if (!session || !canAccess(session.role, "pixel")) redirect("/admin");
  const settings = await getSettings();
  return (
    <PixelCenter
      initial={{
        metaPixelEnabled: settings.metaPixelEnabled,
        metaPixelId: settings.metaPixelId,
        metaCapiToken: settings.metaCapiToken,
        metaTestEventCode: settings.metaTestEventCode,
        metaAdvancedMatching: settings.metaAdvancedMatching,
      }}
    />
  );
}
