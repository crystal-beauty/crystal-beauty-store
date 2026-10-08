import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display, Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getSettings } from "@/lib/settings";
import { SettingsProvider } from "@/components/store/settings-provider";
import { LocaleProvider } from "@/components/store/locale-provider";
import { getLang } from "@/lib/locale-server";
import MetaPixelScript from "@/components/store/meta-pixel-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a1f44",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: settings.seoTitle || settings.storeName,
      template: `%s · ${settings.storeName}`,
    },
    description: settings.seoDescription || undefined,
    icons: { icon: settings.logoUrl || "/logo.svg" },
    openGraph: {
      title: settings.seoTitle || settings.storeName,
      description: settings.seoDescription || undefined,
      siteName: settings.storeName,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, lang] = await Promise.all([getSettings(), getLang()]);
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${playfair.variable} ${cairo.variable} antialiased bg-background text-foreground ${
          lang === "ar" ? "lang-ar" : ""
        }`}
      >
        <style>{`:root { --primary: ${settings.primaryColor}; --navy: ${settings.primaryColor}; --gold: ${settings.accentColor}; --ring: ${settings.primaryColor}; }`}</style>
        <SettingsProvider settings={settings}>
          <LocaleProvider lang={lang}>
            {children}
            <Toaster position="top-center" richColors />
          </LocaleProvider>
        </SettingsProvider>
        <MetaPixelScript
          pixelId={settings.metaPixelId}
          enabled={settings.metaPixelEnabled}
          advancedMatching={settings.metaAdvancedMatching}
        />
      </body>
    </html>
  );
}
