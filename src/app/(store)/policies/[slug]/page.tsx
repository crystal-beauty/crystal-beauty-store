import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/locale-server";
import { pick } from "@/lib/i18n";

const POLICIES: Record<string, { frKey: string; arKey: string; titleFr: string; titleAr: string }> = {
  delivery: { frKey: "policyDelivery", arKey: "policyDeliveryAr", titleFr: "Livraison", titleAr: "التوصيل" },
  returns: { frKey: "policyReturns", arKey: "policyReturnsAr", titleFr: "Retours", titleAr: "الإرجاع" },
  privacy: { frKey: "policyPrivacy", arKey: "policyPrivacyAr", titleFr: "Confidentialité", titleAr: "الخصوصية" },
};

export const dynamic = "force-dynamic";

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  const settings = await getSettings();
  const lang = await getLang();
  const fr = settings[policy.frKey as keyof typeof settings] as string;
  const ar = settings[policy.arKey as keyof typeof settings] as string;
  const body = pick(fr, ar, lang);
  // No made-up policy text: if the admin hasn't written one, the page doesn't exist.
  if (!body.trim()) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--primary)] transition-colors mb-6">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {lang === "ar" ? "الرئيسية" : "Accueil"}
      </Link>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)] mb-8">
        {lang === "ar" ? policy.titleAr : policy.titleFr}
      </h1>
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-luxe">
        <div className="text-foreground/80 leading-relaxed whitespace-pre-line">{body}</div>
      </div>
    </div>
  );
}
