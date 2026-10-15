import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/locale-server";
import { t, pick } from "@/lib/i18n";
import { parseMedia } from "@/lib/format";
import { Banknote, Truck, Gift, PackageSearch, ArrowRight, Sparkles, ClipboardCheck } from "lucide-react";
import ProductCard, { type ProductCardData } from "@/components/store/product-card";
import Reveal from "@/components/store/reveal";
import { toInternationalDz } from "@/lib/format";
import {
  getLocalizedCategoryName,
  getLocalizedCategoryDesc,
  getLocalizedProductName,
  getLocalizedProductShortDesc,
} from "@/lib/catalog-i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, lang] = await Promise.all([getSettings(), getLang()]);

  const [categories, featured, popular] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    db.product.findMany({
      where: { active: true, featured: true },
      include: { variants: { take: 1 }, category: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.product.findMany({
      where: { active: true },
      include: { variants: { take: 1 }, category: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const toCard = (p: (typeof featured)[number]): ProductCardData => {
    const media = parseMedia(p.media);
    return {
      id: p.id,
      name: getLocalizedProductName(p.slug, p.name, lang),
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      image: media[0]?.url || "",
      stock: p.stock,
      trackStock: p.trackStock,
      hasVariants: p.variants.length > 0,
      shortDescription: getLocalizedProductShortDesc(p.slug, p.shortDescription, lang),
      categoryName: p.category ? getLocalizedCategoryName(p.category.slug, p.category.name, lang) : null,
    };
  };

  const featuredCards = (featured.length > 0 ? featured : popular).map(toCard);
  const heroTitle = pick(settings.heroTitle, settings.heroTitleAr, lang) || settings.storeName;
  const heroSubtitle = pick(settings.heroSubtitle, settings.heroSubtitleAr, lang);
  const heroCta = settings.heroCtaText || t("shopCollection", lang);

  const isAr = lang === "ar";
  const v = "?v=20261012";
  const desktopWebp = (isAr ? "/uploads/hero-desktop-ar.webp" : "/uploads/hero-desktop.webp") + v;
  const desktopJpg =
    (isAr
      ? (settings.heroImageAr || "/uploads/hero-desktop-ar.jpg")
      : (settings.heroImage || "/uploads/hero-desktop.jpg")) + v;

  const mobileWebp = (isAr ? "/uploads/hero-mobile-ar.webp" : "/uploads/hero-mobile.webp") + v;
  const mobileJpg =
    (isAr
      ? (settings.heroImageMobileAr || "/uploads/hero-mobile-ar.jpg")
      : (settings.heroImageMobile || "/uploads/hero-mobile.jpg")) + v;

  return (
    <div>
      {/* ================= HERO — Responsive Desktop & Phone View (Bilingual FR / AR) ================= */}
      <section className="relative overflow-hidden bg-[var(--primary)]">
        <Link
          href={settings.heroCtaLink || "/products"}
          className="group block relative w-full overflow-hidden focus:outline-none"
          aria-label={heroTitle || "Crystal Beauty"}
        >
          {/* Accessible semantic H1 for SEO / Screen readers */}
          <h1 className="sr-only">
            {heroTitle} — {heroSubtitle}
          </h1>

          <picture className="block w-full">
            {/* Phone View (< 768px): Vertical 9:16 portrait banner */}
            <source
              media="(max-width: 767px)"
              srcSet={mobileWebp}
              type="image/webp"
            />
            <source
              media="(max-width: 767px)"
              srcSet={mobileJpg}
              type="image/jpeg"
            />

            {/* Desktop View (>= 768px): Horizontal 16:9 landscape banner */}
            <source
              media="(min-width: 768px)"
              srcSet={desktopWebp}
              type="image/webp"
            />
            <source
              media="(min-width: 768px)"
              srcSet={desktopJpg}
              type="image/jpeg"
            />

            {/* Fallback image */}
            <img
              src={desktopJpg}
              alt={settings.storeName}
              fetchPriority="high"
              decoding="async"
              className="w-full h-auto object-cover select-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
          </picture>
        </Link>
      </section>

      {/* ================= TRUST BAR (verifiable claims only) ================= */}
      <section className="border-y border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Banknote, title: t("codBadge", lang), text: t("codBadgeText", lang) },
            { icon: Truck, title: t("wilayasBadge", lang), text: t("wilayasBadgeText", lang) },
            { icon: Gift, title: t("giftBadge", lang), text: t("giftBadgeText", lang) },
            { icon: PackageSearch, title: t("trackBadge", lang), text: t("trackBadgeText", lang) },
          ].map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 80} className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[var(--brand)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS (honest, COD-specific) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Reveal className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)] mb-2">{t("howEyebrow", lang)}</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">{t("howTitle", lang)}</h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-4 lg:gap-8">
          {[
            { icon: Gift, title: t("howStep1Title", lang), text: t("howStep1Text", lang) },
            { icon: ClipboardCheck, title: t("howStep2Title", lang), text: t("howStep2Text", lang) },
            { icon: Banknote, title: t("howStep3Title", lang), text: t("howStep3Text", lang) },
          ].map(({ icon: Icon, title, text }, i) => (
            <Reveal
              key={title}
              delay={i * 120}
              className="relative bg-white rounded-2xl border border-border p-7 lg:p-8 shadow-luxe hover:shadow-luxe-lg transition-shadow"
            >
              <span
                aria-hidden
                className="absolute top-5 end-6 font-display text-5xl font-semibold text-[var(--primary)]/[0.07] select-none"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="h-12 w-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center mb-5 shadow-luxe">
                <Icon className="h-5.5 w-5.5 text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[var(--primary)]">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)] mb-2">{t("browse", lang)}</p>
              <h2 className="font-display text-3xl font-semibold text-[var(--primary)]">{t("shopByCollection", lang)}</h2>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:text-[var(--brand)] transition-colors">
              {t("viewAll", lang)} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group relative overflow-hidden rounded-3xl aspect-[4/5] shadow-luxe hover:shadow-luxe-lg transition-all">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--primary)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/90 via-[var(--primary)]/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70 block mb-1">
                    {lang === "ar" ? "تشكيلة" : "Collection"}
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-white">
                    {getLocalizedCategoryName(cat.slug, cat.name, lang)}
                  </h3>
                  <p className="text-xs text-white/80 mt-1.5 line-clamp-2 leading-relaxed">
                    {getLocalizedCategoryDesc(cat.slug, cat.description, lang)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    {t("browse", lang)} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= EDITORIAL LUXURY SHOWCASE ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--primary)] text-white shadow-luxe-lg border border-white/10">
          <div className="grid lg:grid-cols-2 items-center">
            <div className="p-8 sm:p-12 lg:p-16 space-y-6">
              <span className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                {lang === "ar" ? "تجربة فاخرة واستثنائية" : "L'Art d'Illuminer & d'Offrir"}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
                {lang === "ar" ? "هدايا استثنائية، أناقة راقية وتوصيل موثوق" : "L'Émotion d'Offrir, la Magie en Plus"}
              </h2>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-xl">
                {lang === "ar"
                  ? "ننتقي لكم بعناية أجمل المصابيح الساحرة، الكرات البلورية المضيئة وساعات الديكور، مع علب هدايا ملكية فاخرة وتوصيل سريع لكافة 58 ولاية مع راحة الدفع عند الاستلام."
                  : "Chaque création Crystal Beauty est pensée pour illuminer votre intérieur ou offrir un souvenir inoubliable : lampes féeriques, boules de cristal lumineuses et écrins raffinés. Commandez en toute sérénité avec paiement à la livraison sur 58 wilayas."}
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="press inline-flex items-center gap-2 bg-white text-[var(--primary)] hover:bg-[#e8ecf5] font-semibold px-8 py-4 rounded-full shadow-md text-sm"
                >
                  {t("shopCollection", lang)} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                {settings.whatsappNumber && (
                  <a
                    href={`https://wa.me/${toInternationalDz(settings.whatsappNumber).replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-7 py-4 rounded-full transition-colors text-sm border border-white/20"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[380px] overflow-hidden">
              <img
                src="/images/real-giftbox-navy.jpg"
                alt={lang === "ar" ? "علبة هدايا كريستال بيوتي الفاخرة" : "Écrin Cadeau Signature Crystal Beauty"}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[var(--primary)] via-transparent to-transparent rtl:lg:bg-gradient-to-l" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section className="bg-white/60 border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)] mb-2">{t("shopAll", lang)}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">{settings.storeName}</h2>
          </div>
          {featuredCards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
              {featuredCards.slice(0, 8).map((product, i) => (
                <Reveal key={product.id} delay={(i % 4) * 80}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          ) : (
            // Clean honest empty state — no fabricated products
            <Reveal className="rounded-3xl border-2 border-dashed border-border bg-white py-14 px-8 text-center max-w-2xl mx-auto">
              <img
                src="/uploads/coming-soon-gift.png"
                alt=""
                aria-hidden
                loading="lazy"
                className="h-44 w-44 sm:h-52 sm:w-52 object-contain mx-auto mb-2"
              />
              <p className="font-display text-xl font-semibold text-[var(--primary)]">{t("comingSoon", lang)}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{t("emptyStoreHint", lang)}</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                {settings.whatsappNumber && (
                  <a
                    href={`https://wa.me/${toInternationalDz(settings.whatsappNumber).replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 font-medium px-7 py-3 rounded-full transition-colors text-sm"
                  >
                    {t("thankYouWhatsapp", lang)}
                  </a>
                )}
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 border border-[var(--primary)]/25 text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-medium px-7 py-3 rounded-full transition-colors text-sm"
                >
                  {t("shopAll", lang)} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ================= CTA — full-bleed navy band, flows into the footer ================= */}
      <section className="relative overflow-hidden bg-[var(--primary)]">
        <div className="absolute inset-0 dot-texture opacity-30" aria-hidden />
        <Reveal className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16 lg:py-20 text-center">
          <Sparkles className="h-10 w-10 text-white/80 mx-auto mb-5" />
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight text-balance">{t("codBadge", lang)}</h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">{t("ctaSubtitle", lang)}</p>
          <Link
            href="/products"
            className="press mt-9 inline-flex items-center gap-2 bg-white text-[var(--primary)] hover:bg-[#e8ecf5] font-semibold px-9 py-4 rounded-full shadow-md"
          >
            {t("startGifting", lang)} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
