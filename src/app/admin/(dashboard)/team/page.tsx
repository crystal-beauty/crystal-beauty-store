import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";
import TeamManager from "@/components/admin/team-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Équipe" };

export default async function AdminTeamPage() {
  const session = await getSession();
  if (!session || !canAccess(session.role, "team")) redirect("/admin");
  return <TeamManager currentUserId={session.id} isOwner={session.role === "OWNER"} />;
}
