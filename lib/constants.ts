import { DEFAULT_CONFIG } from "@/lib/site-config-shared";

export const siteConfig = {
  name: DEFAULT_CONFIG.businessName,
  description: DEFAULT_CONFIG.siteDescription,
  url: process.env.NEXT_PUBLIC_APP_URL || "https://lookkoolladiesworld.com",
  logo: "/NewLogo.png",
  brandColor: DEFAULT_CONFIG.sitePrimaryColor,
} as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
] as const;
