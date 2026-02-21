import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LayoutShell } from "@/components/layout/layout-shell";
import { getPublicSiteConfig, hexToHsl } from "@/lib/site-config";
import { cache } from "react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Deduplicate DB call within a single request
const getCachedSiteConfig = cache(getPublicSiteConfig);

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await getCachedSiteConfig();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://lookkoolladiesworld.com";

  const title = config.seoTitle || config.businessName;
  const description =
    config.seoDescription || config.siteDescription || config.businessName;
  const keywords = config.seoKeywords
    ? config.seoKeywords.split(",").map((k) => k.trim())
    : undefined;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: `%s | ${config.businessName}`,
    },
    description,
    keywords,
    openGraph: {
      type: "website",
      siteName: config.businessName,
      title,
      description,
      url: baseUrl,
      ...(config.ogImageUrl && {
        images: [
          {
            url: config.ogImageUrl,
            width: 1200,
            height: 630,
            alt: config.businessName,
          },
        ],
      }),
      ...(config.siteLogoUrl && !config.ogImageUrl && {
        images: [{ url: config.siteLogoUrl, alt: config.businessName }],
      }),
    },
    twitter: {
      card: config.ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(config.ogImageUrl && { images: [config.ogImageUrl] }),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getCachedSiteConfig();

  // Build dynamic CSS override for primary brand color
  const { h, s, l } = hexToHsl(siteConfig.sitePrimaryColor);
  const primaryHsl = `${h} ${s}% ${l}%`;
  const accentHsl = `${h} ${Math.min(s, 35)}% 95%`;
  const fgHsl = l > 55 ? "0 0% 5%" : "0 0% 100%";
  const dynamicCss = `:root{--primary:${primaryHsl};--primary-foreground:${fgHsl};--ring:${primaryHsl};--accent:${accentHsl};--accent-foreground:${primaryHsl};--chart-1:${primaryHsl};}`;

  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <LayoutShell
          navbar={<Navbar siteConfig={siteConfig} />}
          footer={<Footer siteConfig={siteConfig} />}
        >
          {children}
        </LayoutShell>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
