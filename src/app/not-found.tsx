import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#0a1f44]/5 border border-[#0a1f44]/10 mb-6">
          <Sparkles className="h-7 w-7 text-[#c8a24b]" />
        </div>
        <p className="font-display text-7xl font-semibold text-[#0a1f44]">404</p>
        <h1 className="font-display text-2xl font-semibold text-[#0a1f44] mt-3">Page introuvable · الصفحة غير موجودة</h1>
        <p className="mt-3 text-sm text-[#6b7280] leading-relaxed">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
          <br />
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 bg-[#0a1f44] text-white font-medium px-8 py-3.5 rounded-full hover:bg-[#0a1f44]/90 transition-colors text-sm"
        >
          Retour à la boutique · العودة للمتجر
        </Link>
      </div>
    </div>
  );
}
