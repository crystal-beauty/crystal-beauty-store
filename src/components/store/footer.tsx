import Link from "next/link";
import { Sparkles, Facebook, Instagram, Twitter, Music2, Phone, Mail, MapPin, Clock, Banknote, Truck, PackageSearch } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { pick } from "@/lib/i18n";

export default async function StoreFooter() {
  const settings = await getSettings();
  const lang = await getLang();
  const year = new Date().getFullYear();

  const socials = [
    { url: settings.facebookUrl, icon: Facebook, label: "Facebook" },
    { url: settings.instagramUrl, icon: Instagram, label: "Instagram" },
    { url: settings.tiktokUrl, icon: Music2, label: "TikTok" },
    { url: settings.twitterUrl, icon: Twitter, label: "Twitter" },
  ].filter((s) => s.url);

  const policies = [
    { href: "/policies/delivery", label: t("policyDelivery", lang), body: pick(settings.policyDelivery, settings.policyDeliveryAr, lang) },
    { href: "/policies/returns", label: t("policyReturns", lang), body: pick(settings.policyReturns, settings.policyReturnsAr, lang) },
    { href: "/policies/privacy", label: t("policyPrivacy", lang), body: pick(settings.policyPrivacy, settings.policyPrivacyAr, lang) },
  ].filter((p) => p.body.trim());

  return (
    <footer
      className="mt-auto text-[var(--primary-foreground)] border-t border-white/10"
      style={{ backgroundColor: "color-mix(in srgb, var(--primary) 82%, black)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-[var(--gold)]" />
              <span className="font-display text-2xl font-semibold">{settings.storeName}</span>
            </div>
            {settings.footerAbout && <p className="text-sm leading-relaxed text-white/70 max-w-md">{settings.footerAbout}</p>}
            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-6">
                {socials.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-[var(--gold)] transition-colors flex items-center justify-center"
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                ))}
              </div>
            )}
            {/* Assurance badges — verifiable claims only (COD is the only payment method) */}
            <div className="flex flex-wrap items-center gap-2.5 mt-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/80">
                <Banknote className="h-3.5 w-3.5 text-[var(--gold)]" />
                {t("codBadge", lang)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/80">
                <Truck className="h-3.5 w-3.5 text-[var(--gold)]" />
                {t("wilayasBadge", lang)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/80">
                <PackageSearch className="h-3.5 w-3.5 text-[var(--gold)]" />
                {t("trackBadge", lang)}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)] mb-4">{t("quickLinks", lang)}</h3>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  {t("shopAll", lang)}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  {t("cart", lang)}
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors">
                  {t("trackOrder", lang)}
                </Link>
              </li>
              {policies.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="hover:text-white transition-colors">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)] mb-4">{t("getInTouch", lang)}</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {settings.contactPhone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                  <a href={`tel:${settings.contactPhone}`} className="hover:text-white transition-colors" dir="ltr">
                    {settings.contactPhone}
                  </a>
                </li>
              )}
              {settings.contactEmail && (
                <li className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors break-all">
                    {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings.contactAddress && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{settings.contactAddress}</span>
                </li>
              )}
              {settings.contactHours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{settings.contactHours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <p>{settings.footerText.replace("{year}", String(year)).replace("{store}", settings.storeName)}</p>
          {settings.carrierEnabled && (
            <p className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" />
              {t("footerDeliveryNote", lang)}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
