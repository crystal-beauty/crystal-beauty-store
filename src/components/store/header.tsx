"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X, PackageSearch, Sparkles } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart";
import { useSettings } from "@/components/store/settings-provider";
import { useT, useLang, useSetLang } from "@/components/store/locale-provider";
import { cn } from "@/lib/utils";

export default function StoreHeader() {
  const settings = useSettings();
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();
  const lang = useLang();
  const setLang = useSetLang();

  const NAV_LINKS = [
    { href: "/products", label: t("shopAll") },
    { href: "/track", label: t("trackOrder") },
  ];

  return (
    <>
      {settings.announcementEnabled && settings.announcementText && (
        <div className="bg-[var(--primary)] text-[var(--primary-foreground)] text-center text-xs sm:text-sm py-2 px-4">
          <Link href={settings.announcementLink || "/products"} className="hover:underline">
            {lang === "ar" && settings.announcementTextAr ? settings.announcementTextAr : settings.announcementText}
          </Link>
        </div>
      )}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu button */}
            <button className="lg:hidden p-2 -ms-2 text-[var(--primary)]" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.storeName} className="h-8 w-auto" />
              ) : (
                <Sparkles className="h-6 w-6 text-[var(--gold)]" />
              )}
              <span className="font-display text-xl lg:text-2xl font-semibold tracking-wide text-[var(--primary)]">{settings.storeName}</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[var(--primary)]">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={cn("hover:text-[var(--gold)] transition-colors", pathname === link.href && "text-[var(--gold)]")}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Language switcher */}
              <div className="flex items-center rounded-full border border-border overflow-hidden text-xs font-semibold" role="group" aria-label="Language">
                <button
                  onClick={() => setLang("fr")}
                  className={cn("px-2.5 py-1.5 transition-colors", lang === "fr" ? "bg-[var(--primary)] text-white" : "text-[var(--primary)] hover:bg-muted")}
                  aria-pressed={lang === "fr"}
                >
                  FR
                </button>
                <button
                  onClick={() => setLang("ar")}
                  className={cn("px-2.5 py-1.5 transition-colors", lang === "ar" ? "bg-[var(--primary)] text-white" : "text-[var(--primary)] hover:bg-muted")}
                  aria-pressed={lang === "ar"}
                >
                  ع
                </button>
              </div>
              <Link href="/track" className="lg:hidden p-2 text-[var(--primary)]" aria-label={t("trackOrder")}>
                <PackageSearch className="h-5 w-5" />
              </Link>
              <Link href="/cart" className="relative p-2 text-[var(--primary)] hover:text-[var(--gold)] transition-colors" aria-label={`${t("cart")}: ${count}`}>
                <ShoppingBag className="h-6 w-6" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--gold)] text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-border bg-white px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--primary)] hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
