import { redirect } from "next/navigation";
import { getSession, canAccess, ROLE_PERMISSIONS } from "@/lib/auth";
import AdminShell from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // Compute allowed sections server-side (functions can't cross the server/client boundary)
  const allSections = ["overview", "orders", "products", "categories", "reviews", "blocked", "promo", "team", "shipping", "pixel", "settings"];
  const perms = ROLE_PERMISSIONS[session.role] || [];
  const allowedSections =
    perms.includes("*") ? allSections : perms.includes("team") ? allSections : perms;

  return (
    <div dir="ltr" lang="fr">
      <AdminShell session={session} allowedSections={allowedSections}>{children}</AdminShell>
    </div>
  );
}
