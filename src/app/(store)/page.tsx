import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { parseMedia } from "@/lib/format";
import {
  Truck,
  ShieldCheck,
  Gift,
  Sparkles,
  ArrowRight,
  Star,
  Quote,
} from "lucide-react";
import ProductCard, { type ProductCardData } from "@/components/store/product-card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();

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

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="relative overflow-hidden rounded-[2rem] shadow-luxe-lg min-h-[480px] lg:min-h-[560px] flex items-center">
          {settings.heroImage && (
             
            <img
              src={settings.heroImage}
              alt={settings.storeName}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/95 via-[var(--primary)]/75 to-[var(--primary)]/25" />
          <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-16 max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 text-xs font-medium px-4 py-1.5 rounded-full border border-white/20 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
              {settings.tagline}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.1]">
              {settings.heroTitle}
            </h1>
            <p className="mt-5 text-white/80 text-base sm:text-lg leading-relaxed max-w-lg">
              {settings.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={settings.heroCtaLink || "/products"}
                className="inline-flex items-center gap-2 bg-[var(--gold)] hover:bg-[#b8903a] text-white font-medium px-7 py-3.5 rounded-full transition-all hover:scale-[1.02] shadow-lg"
              >
                {settings.heroCtaText}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium px-7 py-3.5 rounded-full transition-colors border border-white/25"
              >
                Track Your Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRUST BAR ================= */}
      <section className="border-y border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "World Express Delivery", text: `Free over ${settings.currencySymbol}${settings.freeShippingThreshold}` },
            { icon: Gift, title: "Gift Boxes On Request", text: "Add elegant wrapping at checkout" },
            { icon: ShieldCheck, title: "Secure & Simple", text: "Easy ordering, cash on delivery" },
            { icon: Sparkles, title: "Hand-Picked Quality", text: "Every piece checked by hand" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-[var(--primary)]/5 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{text}</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)] mb-2">Browse</p>
              <h2 className="font-display text-3xl font-semibold text-[var(--primary)]">Shop by Collection</h2>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:text-[var(--gold)] transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] shadow-luxe"
              >
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
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-display text-xl font-medium text-white">{cat.name}</h3>
                  <p className="text-white/70 text-xs mt-1">Explore collection</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= FEATURED PRODUCTS ================= */}
      <section className="bg-white border-y border-border py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)] mb-2">Loved & Admired</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">Our Bestsellers</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              One perfect gift, chosen with care — no boxes unless you ask for one.
            </p>
          </div>
          {featuredCards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
              {featuredCards.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">Products are coming soon — check back shortly.</p>
          )}
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Shop All Gifts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= GIFT PROMISE ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-luxe-lg aspect-[4/3]">
              {settings.heroImage && (
                 
                <img src={settings.heroImage} alt="Our gift promise" loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="absolute -bottom-5 -right-3 sm:right-8 bg-white rounded-2xl shadow-luxe px-6 py-4 flex items-center gap-3">
              <div className="flex -space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
                ))}
              </div>
              <p className="text-sm font-semibold text-[var(--primary)]">Rated 4.9/5 by gifters</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)] mb-2">The Gift Promise</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)] leading-tight">
              Every gift tells a story. Let us help you tell theirs.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              We keep gifting simple: pick a single beautiful piece, add a personal note, and we handle the rest.
              Our gifts are sold as single pieces by default — and if you want the full unwrapping experience,
              just add an elegant gift box at checkout.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                "Hand-inspected before every dispatch",
                "Fast worldwide shipping with World Express tracking",
                "Gift box with satin ribbon available on request",
                "Friendly support on WhatsApp & email",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-[var(--gold)]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
                  </span>
                  <span className="text-sm text-foreground/80">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="bg-[var(--primary)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)] mb-2">Kind Words</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">From Our Gifters</h2>
          </div>
          <Carousel className="max-w-4xl mx-auto">
            <CarouselContent>
              {[
                {
                  text: "The crystal ball arrived beautifully made, and my sister cried when she opened it. Ordering took two minutes.",
                  name: "Amira K.",
                  city: "Dubai",
                },
                {
                  text: "I ordered one gift without a box, one with — both arrived perfect. The World Express tracking was spot on.",
                  name: "Daniel R.",
                  city: "London",
                },
                {
                  text: "Finally a gift store that understands less is more. One stunning piece, fast delivery, fair price.",
                  name: "Sofia M.",
                  city: "Madrid",
                },
              ].map((t) => (
                <CarouselItem key={t.name} className="md:basis-1/2 lg:basis-1/2">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-full backdrop-blur">
                    <Quote className="h-8 w-8 text-[var(--gold)] mb-4" />
                    <p className="text-white/85 leading-relaxed text-sm sm:text-base">&ldquo;{t.text}&rdquo;</p>
                    <div className="mt-6 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {t.name} <span className="font-normal text-white/50">— {t.city}</span>
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="border-white/20 text-white hover:bg-white/10" />
            <CarouselNext className="border-white/20 text-white hover:bg-white/10" />
          </Carousel>
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--primary)] shadow-luxe-lg px-8 py-14 text-center">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--gold)]/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--gold)]/10 blur-3xl" />
          <Sparkles className="h-10 w-10 text-[var(--gold)] mx-auto mb-5" />
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white max-w-2xl mx-auto leading-tight">
            Make someone&apos;s day — it takes less than two minutes.
          </h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Pick a piece, tell us where it&apos;s going, and let World Express handle the distance.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 bg-[var(--gold)] hover:bg-[#b8903a] text-white font-medium px-9 py-4 rounded-full transition-all hover:scale-[1.02] shadow-lg"
          >
            Start Gifting <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
