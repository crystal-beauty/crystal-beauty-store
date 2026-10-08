import BlockedPhonesManager from "@/components/admin/blocked-phones-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Numéros bloqués" };

export default function AdminBlockedPhonesPage() {
  return <BlockedPhonesManager />;
}
