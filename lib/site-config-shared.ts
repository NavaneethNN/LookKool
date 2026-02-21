/**
 * lib/site-config-shared.ts
 * Client-safe types, defaults, and helpers for site configuration.
 * No server-only imports — safe to import in "use client" components.
 */

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
  // SEO
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImageUrl: string | null;
  // Social links
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTwitter: string | null;
  socialYoutube: string | null;
  // Hero / Banner
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroBadgeText: string | null;
  heroCtaText: string | null;
  heroCtaLink: string | null;
  heroSecondaryCtaText: string | null;
  heroSecondaryCtaLink: string | null;
  // Policies & Payment
  returnPolicy: string;
  returnWindowDays: number;
  cancellationPolicy: string;
  codEnabled: boolean;
};

// ─── Defaults ─────────────────────────────────────────────────

export const DEFAULT_NAV_LINKS: NavLinkConfig[] = [
  { label: "Home", href: "/", enabled: true },
  { label: "Shop All", href: "/shop", enabled: true },
];

export const DEFAULT_QUICK_LINKS: FooterLinkConfig[] = [
  { label: "Shop All", href: "/shop" },
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

export const DEFAULT_CONFIG: PublicSiteConfig = {
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
  // SEO
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  ogImageUrl: null,
  // Social
  socialInstagram: null,
  socialFacebook: null,
  socialTwitter: null,
  socialYoutube: null,
  // Hero
  heroTitle: null,
  heroSubtitle: null,
  heroBadgeText: null,
  heroCtaText: null,
  heroCtaLink: null,
  heroSecondaryCtaText: null,
  heroSecondaryCtaLink: null,
  // Policies & Payment
  returnPolicy: "accept",
  returnWindowDays: 7,
  cancellationPolicy: "before_shipment",
  codEnabled: true,
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
