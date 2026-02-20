/**
 * lib/site-config.ts
 * Server-side utility for reading the storefront's dynamic configuration.
 * NOT a server-action file — call from any server component or layout.
 */

import { db } from "@/db";
import { storeSettings } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────

export type NavLinkConfig = {
  label: string;
  href: string;
  enabled: boolean;
};

export type FooterLinkConfig = {
  label: string;
  href: string;
};

export type PublicSiteConfig = {
  businessName: string;
  siteLogoUrl: string | null;
  sitePrimaryColor: string;
  siteDescription: string | null;
  footerTagline: string | null;
  navLinksConfig: NavLinkConfig[];
  footerQuickLinks: FooterLinkConfig[];
  footerHelpLinks: FooterLinkConfig[];
  footerLegalLinks: FooterLinkConfig[];
  footerContactPhone: string | null;
  footerContactEmail: string | null;
  footerShowMadeInIndia: boolean;
};

// ─── Defaults ─────────────────────────────────────────────────

export const DEFAULT_NAV_LINKS: NavLinkConfig[] = [
  { label: "Home", href: "/", enabled: true },
  { label: "Shop All", href: "/categories/women", enabled: true },
  { label: "New Arrivals", href: "/new-arrivals", enabled: true },
  { label: "Collections", href: "/collections", enabled: true },
  { label: "Offers", href: "/offers", enabled: true },
];

export const DEFAULT_QUICK_LINKS: FooterLinkConfig[] = [
  { label: "Shop All", href: "/categories/women" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Collections", href: "/collections" },
  { label: "Offers", href: "/offers" },
];

export const DEFAULT_HELP_LINKS: FooterLinkConfig[] = [
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping Info", href: "/shipping" },
  { label: "Returns & Refunds", href: "/returns" },
  { label: "FAQ", href: "/faq" },
];

export const DEFAULT_LEGAL_LINKS: FooterLinkConfig[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cancellation Policy", href: "/cancellation" },
];

const DEFAULT_CONFIG: PublicSiteConfig = {
  businessName: "LookKool",
  siteLogoUrl: null,
  sitePrimaryColor: "#470B49",
  siteDescription:
    "Your go-to boutique for trendy, affordable fashion. Quality clothing delivered to your door.",
  footerTagline: null,
  navLinksConfig: DEFAULT_NAV_LINKS,
  footerQuickLinks: DEFAULT_QUICK_LINKS,
  footerHelpLinks: DEFAULT_HELP_LINKS,
  footerLegalLinks: DEFAULT_LEGAL_LINKS,
  footerContactPhone: null,
  footerContactEmail: null,
  footerShowMadeInIndia: true,
};

// ─── Helper: hex → HSL component string ───────────────────────

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return { h: 299, s: 76, l: 16 };

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// ─── Fetcher ──────────────────────────────────────────────────

export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  try {
    const [row] = await db
      .select({
        businessName: storeSettings.businessName,
        siteLogoUrl: storeSettings.siteLogoUrl,
        sitePrimaryColor: storeSettings.sitePrimaryColor,
        siteDescription: storeSettings.siteDescription,
        footerTagline: storeSettings.footerTagline,
        navLinksConfig: storeSettings.navLinksConfig,
        footerQuickLinks: storeSettings.footerQuickLinks,
        footerHelpLinks: storeSettings.footerHelpLinks,
        footerLegalLinks: storeSettings.footerLegalLinks,
        footerContactPhone: storeSettings.footerContactPhone,
        footerContactEmail: storeSettings.footerContactEmail,
        footerShowMadeInIndia: storeSettings.footerShowMadeInIndia,
      })
      .from(storeSettings)
      .limit(1);

    if (!row) return DEFAULT_CONFIG;

    return {
      businessName: row.businessName || DEFAULT_CONFIG.businessName,
      siteLogoUrl: row.siteLogoUrl || null,
      sitePrimaryColor: row.sitePrimaryColor || DEFAULT_CONFIG.sitePrimaryColor,
      siteDescription: row.siteDescription || DEFAULT_CONFIG.siteDescription,
      footerTagline: row.footerTagline || null,
      navLinksConfig:
        (row.navLinksConfig as NavLinkConfig[] | null) || DEFAULT_NAV_LINKS,
      footerQuickLinks:
        (row.footerQuickLinks as FooterLinkConfig[] | null) ||
        DEFAULT_QUICK_LINKS,
      footerHelpLinks:
        (row.footerHelpLinks as FooterLinkConfig[] | null) || DEFAULT_HELP_LINKS,
      footerLegalLinks:
        (row.footerLegalLinks as FooterLinkConfig[] | null) ||
        DEFAULT_LEGAL_LINKS,
      footerContactPhone: row.footerContactPhone || null,
      footerContactEmail: row.footerContactEmail || null,
      footerShowMadeInIndia: row.footerShowMadeInIndia ?? true,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
