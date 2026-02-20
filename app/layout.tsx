import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const config = await getCachedSiteConfig();
  return {
    title: {
      default: config.businessName,
      template: `%s | ${config.businessName}`,
    },
    description: config.siteDescription ?? config.businessName,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteConfig, supabase] = await Promise.all([
    getCachedSiteConfig(),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <Navbar
          user={user ? { id: user.id, email: user.email } : null}
          siteConfig={siteConfig}
        />
        <main className="flex-1">{children}</main>
        <Footer siteConfig={siteConfig} />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
