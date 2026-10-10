import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getLang } from "@/lib/locale-server";
import { t } from "@/lib/i18n";

/**
 * 404 — respects the visitor's language cookie (FR default, AR RTL).
 */
export default async function NotFound() {
  const lang = await getLang();
  const rtl = lang === "ar";

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="text-center max-w-md" dir={rtl ? "rtl" : "ltr"}>
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#0a1f44]/5 border border-[#0a1f44]/10 mb-6">
          <Sparkles className="h-7 w-7 text-[#0a1f44]" />
        </div>
        <p className="font-display text-7xl font-semibold text-[#0a1f44]">404</p>
        <h1 className="font-display text-2xl font-semibold text-[#0a1f44] mt-3">{t("notFoundTitle", lang)}</h1>
        <p className="mt-3 text-sm text-[#6b7280] leading-relaxed">{t("notFoundText", lang)}</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 bg-[#0a1f44] text-white font-medium px-8 py-3.5 rounded-full hover:bg-[#0a1f44]/90 transition-colors text-sm"
        >
          {t("backHome", lang)}
        </Link>
      </div>
    </div>
  );
}
