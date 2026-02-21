/**
 * lib/site-config.ts
 * Server-side utility for reading the storefront's dynamic configuration.
 * NOT a server-action file — call from any server component or layout.
 */

import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import type { NavLinkConfig, FooterLinkConfig, PublicSiteConfig } from "@/lib/site-config-shared";
import {
  DEFAULT_NAV_LINKS,
  DEFAULT_QUICK_LINKS,
  DEFAULT_HELP_LINKS,
  DEFAULT_LEGAL_LINKS,
  DEFAULT_CONFIG,
} from "@/lib/site-config-shared";

// Re-export client-safe types and defaults for backwards compatibility
export type { NavLinkConfig, FooterLinkConfig, PublicSiteConfig } from "@/lib/site-config-shared";
export {
  DEFAULT_NAV_LINKS,
  DEFAULT_QUICK_LINKS,
  DEFAULT_HELP_LINKS,
  DEFAULT_LEGAL_LINKS,
  DEFAULT_CONFIG,
  hexToHsl,
} from "@/lib/site-config-shared";


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
        // SEO
        seoTitle: storeSettings.seoTitle,
        seoDescription: storeSettings.seoDescription,
        seoKeywords: storeSettings.seoKeywords,
        ogImageUrl: storeSettings.ogImageUrl,
        // Social
        socialInstagram: storeSettings.socialInstagram,
        socialFacebook: storeSettings.socialFacebook,
        socialTwitter: storeSettings.socialTwitter,
        socialYoutube: storeSettings.socialYoutube,
        // Hero
        heroTitle: storeSettings.heroTitle,
        heroSubtitle: storeSettings.heroSubtitle,
        heroBadgeText: storeSettings.heroBadgeText,
        heroCtaText: storeSettings.heroCtaText,
        heroCtaLink: storeSettings.heroCtaLink,
        heroSecondaryCtaText: storeSettings.heroSecondaryCtaText,
        heroSecondaryCtaLink: storeSettings.heroSecondaryCtaLink,
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
      // SEO
      seoTitle: row.seoTitle || null,
      seoDescription: row.seoDescription || null,
      seoKeywords: row.seoKeywords || null,
      ogImageUrl: row.ogImageUrl || null,
      // Social
      socialInstagram: row.socialInstagram || null,
      socialFacebook: row.socialFacebook || null,
      socialTwitter: row.socialTwitter || null,
      socialYoutube: row.socialYoutube || null,
      // Hero
      heroTitle: row.heroTitle || null,
      heroSubtitle: row.heroSubtitle || null,
      heroBadgeText: row.heroBadgeText || null,
      heroCtaText: row.heroCtaText || null,
      heroCtaLink: row.heroCtaLink || null,
      heroSecondaryCtaText: row.heroSecondaryCtaText || null,
      heroSecondaryCtaLink: row.heroSecondaryCtaLink || null,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
