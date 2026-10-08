import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getSettings } from "@/lib/settings";
import { SettingsProvider } from "@/components/store/settings-provider";
import MetaPixelScript from "@/components/store/meta-pixel-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: settings.seoTitle || `${settings.storeName} — ${settings.tagline}`,
      template: `%s · ${settings.storeName}`,
    },
    description: settings.seoDescription,
    icons: { icon: settings.logoUrl || "/logo.svg" },
    openGraph: {
      title: settings.seoTitle || settings.storeName,
      description: settings.seoDescription,
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
  const settings = await getSettings();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${playfair.variable} antialiased bg-background text-foreground`}>
        <style>{`:root { --primary: ${settings.primaryColor}; --navy: ${settings.primaryColor}; --gold: ${settings.accentColor}; --ring: ${settings.primaryColor}; }`}</style>
        <SettingsProvider settings={settings}>
          {children}
          <Toaster position="top-center" richColors />
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
