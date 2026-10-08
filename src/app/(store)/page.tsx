import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/locale-server";
import { t, pick } from "@/lib/i18n";
import { parseMedia } from "@/lib/format";
import { Banknote, Truck, Gift, PackageSearch, Package, ArrowRight, Sparkles } from "lucide-react";
import ProductCard, { type ProductCardData } from "@/components/store/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, lang] = await Promise.all([getSettings(), getLang()]);

  const [categories, featured, popular] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    db.product.findMany({
      where: { active: true, featured: true },
      include: { variants: { take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.product.findMany({
      where: { active: true },
      include: { variants: { take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const toCard = (p: (typeof featured)[number]): ProductCardData => {
    const media = parseMedia(p.media);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      image: media[0]?.url || "",
      stock: p.stock,
      trackStock: p.trackStock,
      hasVariants: p.variants.length > 0,
      shortDescription: p.shortDescription,
    };
  };

  const featuredCards = (featured.length > 0 ? featured : popular).map(toCard);
  const heroTitle = pick(settings.heroTitle, settings.heroTitleAr, lang) || settings.storeName;
  const heroSubtitle = pick(settings.heroSubtitle, settings.heroSubtitleAr, lang);
  const heroCta = settings.heroCtaText || t("shopCollection", lang);

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="relative overflow-hidden rounded-[2rem] shadow-luxe-lg min-h-[440px] lg:min-h-[540px] flex items-center bg-[var(--primary)]">
          {settings.heroImage && (
            <img
              src={settings.heroImage}
              alt={settings.storeName}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className={`absolute inset-0 ${settings.heroImage ? "bg-gradient-to-r from-[var(--primary)]/95 via-[var(--primary)]/75 to-[var(--primary)]/25 rtl:bg-gradient-to-l" : ""}`} />
          <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-16 max-w-2xl">
            {settings.tagline && (
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 text-xs font-medium px-4 py-1.5 rounded-full border border-white/20 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
                {settings.tagline}
              </span>
            )}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.1]">{heroTitle}</h1>
            {heroSubtitle && <p className="mt-5 text-white/80 text-base sm:text-lg leading-relaxed max-w-lg">{heroSubtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={settings.heroCtaLink || "/products"}
                className="inline-flex items-center gap-2 bg-[var(--gold)] hover:bg-[#b8903a] text-white font-medium px-7 py-3.5 rounded-full transition-all hover:scale-[1.02] shadow-lg"
              >
                {heroCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium px-7 py-3.5 rounded-full transition-colors border border-white/25"
              >
                {t("trackYourOrder", lang)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRUST BAR (verifiable claims only) ================= */}
      <section className="border-y border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Banknote, title: t("codBadge", lang), text: t("codBadgeText", lang) },
            { icon: Truck, title: t("wilayasBadge", lang), text: t("wilayasBadgeText", lang) },
            { icon: Gift, title: t("giftBadge", lang), text: t("giftBadgeText", lang) },
            { icon: PackageSearch, title: t("trackBadge", lang), text: t("trackBadgeText", lang) },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-[var(--primary)]/5 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)] mb-2">{t("browse", lang)}</p>
              <h2 className="font-display text-3xl font-semibold text-[var(--primary)]">{t("shopByCollection", lang)}</h2>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:text-[var(--gold)] transition-colors">
              {t("viewAll", lang)} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group relative overflow-hidden rounded-2xl aspect-[4/5] shadow-luxe">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--primary)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/90 via-[var(--primary)]/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <h3 className="font-display text-xl font-medium text-white">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= PRODUCTS ================= */}
      <section className="bg-white border-y border-border py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)] mb-2">{t("shopAll", lang)}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">{settings.storeName}</h2>
          </div>
          {featuredCards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
              {featuredCards.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            // Clean empty state — no fake products
            <div className="text-center py-14">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{t("comingSoon", lang)}</p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-medium px-8 py-3 rounded-full transition-colors"
              >
                {t("shopAll", lang)} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--primary)] shadow-luxe-lg px-8 py-14 text-center">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--gold)]/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--gold)]/10 blur-3xl" />
          <Sparkles className="h-10 w-10 text-[var(--gold)] mx-auto mb-5" />
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white max-w-2xl mx-auto leading-tight">{t("codBadge", lang)}</h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">{t("ctaSubtitle", lang)}</p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 bg-[var(--gold)] hover:bg-[#b8903a] text-white font-medium px-9 py-4 rounded-full transition-all hover:scale-[1.02] shadow-lg"
          >
            {t("startGifting", lang)} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    </div>
  );
}
