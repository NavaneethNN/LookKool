"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Globe, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { upsertSiteAppearance } from "@/lib/actions/settings.actions";
import {
  DEFAULT_NAV_LINKS,
  DEFAULT_QUICK_LINKS,
  DEFAULT_HELP_LINKS,
  DEFAULT_LEGAL_LINKS,
} from "@/lib/site-config-shared";
import { Section, type SiteAppearanceData, type Category } from "./shared";
import { LogoColorSection } from "./logo-color-section";
import { SeoSection } from "./seo-section";
import { NavLinksEditor } from "./nav-links-editor";
import { FooterLinksEditor } from "./footer-links-editor";
import { SocialLinksSection } from "./social-links-section";
import { HeroSectionEditor } from "./hero-section-editor";

// Re-export types so consumers can import from the barrel
export type { SiteAppearanceData, Category } from "./shared";

// ─── Main Form Component ──────────────────────────────────────

export function SiteAppearanceForm({
  settings,
  categories,
}: {
  settings: Partial<SiteAppearanceData> | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<SiteAppearanceData>({
    siteLogoUrl: settings?.siteLogoUrl ?? "",
    sitePrimaryColor: settings?.sitePrimaryColor ?? "#470B49",
    siteDescription: settings?.siteDescription ?? "",
    footerTagline: settings?.footerTagline ?? "",
    navLinksConfig: settings?.navLinksConfig ?? DEFAULT_NAV_LINKS,
    footerQuickLinks: settings?.footerQuickLinks ?? DEFAULT_QUICK_LINKS,
    footerHelpLinks: settings?.footerHelpLinks ?? DEFAULT_HELP_LINKS,
    footerLegalLinks: settings?.footerLegalLinks ?? DEFAULT_LEGAL_LINKS,
    footerContactPhone: settings?.footerContactPhone ?? "",
    footerContactEmail: settings?.footerContactEmail ?? "",
    footerShowMadeInIndia: settings?.footerShowMadeInIndia ?? true,
    // SEO
    seoTitle: settings?.seoTitle ?? "",
    seoDescription: settings?.seoDescription ?? "",
    seoKeywords: settings?.seoKeywords ?? "",
    ogImageUrl: settings?.ogImageUrl ?? "",
    // Social
    socialInstagram: settings?.socialInstagram ?? "",
    socialFacebook: settings?.socialFacebook ?? "",
    socialTwitter: settings?.socialTwitter ?? "",
    socialYoutube: settings?.socialYoutube ?? "",
    // Hero
    heroTitle: settings?.heroTitle ?? "",
    heroSubtitle: settings?.heroSubtitle ?? "",
    heroBadgeText: settings?.heroBadgeText ?? "",
    heroCtaText: settings?.heroCtaText ?? "",
    heroCtaLink: settings?.heroCtaLink ?? "",
    heroSecondaryCtaText: settings?.heroSecondaryCtaText ?? "",
    heroSecondaryCtaLink: settings?.heroSecondaryCtaLink ?? "",
  });

  const [saving, setSaving] = useState(false);

  const update = <K extends keyof SiteAppearanceData>(
    key: K,
    value: SiteAppearanceData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    setSaving(true);
    try {
      const result = await upsertSiteAppearance({
        siteLogoUrl: form.siteLogoUrl || null,
        sitePrimaryColor: form.sitePrimaryColor,
        siteDescription: form.siteDescription || null,
        footerTagline: form.footerTagline || null,
        navLinksConfig: form.navLinksConfig,
        footerQuickLinks: form.footerQuickLinks,
        footerHelpLinks: form.footerHelpLinks,
        footerLegalLinks: form.footerLegalLinks,
        footerContactPhone: form.footerContactPhone || null,
        footerContactEmail: form.footerContactEmail || null,
        footerShowMadeInIndia: form.footerShowMadeInIndia,
        // SEO
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        seoKeywords: form.seoKeywords || null,
        ogImageUrl: form.ogImageUrl || null,
        // Social
        socialInstagram: form.socialInstagram || null,
        socialFacebook: form.socialFacebook || null,
        socialTwitter: form.socialTwitter || null,
        socialYoutube: form.socialYoutube || null,
        // Hero
        heroTitle: form.heroTitle || null,
        heroSubtitle: form.heroSubtitle || null,
        heroBadgeText: form.heroBadgeText || null,
        heroCtaText: form.heroCtaText || null,
        heroCtaLink: form.heroCtaLink || null,
        heroSecondaryCtaText: form.heroSecondaryCtaText || null,
        heroSecondaryCtaLink: form.heroSecondaryCtaLink || null,
      });
      if (result.success) {
        toast.success("Site appearance saved!");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Logo & Brand Color ─────────────────────────────── */}
      <LogoColorSection form={form} update={update} />

      {/* ── Shop Info ──────────────────────────────────────── */}
      <Section
        icon={<Globe className="h-4 w-4" />}
        title="Shop Identity"
        description="Name and description used across the site. Shop name is set in Store & Billing tab."
      >
        <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Your <strong>shop name</strong> is configured in the{" "}
            <strong>Store &amp; Billing</strong> tab under{" "}
            <em>Business Name</em>. It appears in the navbar (alt text),
            footer copyright, and page titles.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Shop Description
            </label>
            <p className="text-xs text-gray-500">
              Used for SEO meta description and in the footer below the logo.
            </p>
            <textarea
              value={form.siteDescription}
              onChange={(e) => update("siteDescription", e.target.value)}
              rows={2}
              placeholder="Your go-to boutique for trendy, affordable fashion…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Footer Tagline
            </label>
            <p className="text-xs text-gray-500">
              Short tagline shown below the logo in the footer. Overrides
              Shop Description if set.
            </p>
            <Input
              value={form.footerTagline}
              onChange={(e) => update("footerTagline", e.target.value)}
              placeholder="Quality clothing delivered to your door."
            />
          </div>
        </div>
      </Section>

      {/* ── Navbar Links ───────────────────────────────────── */}
      <NavLinksEditor
        navLinksConfig={form.navLinksConfig}
        categories={categories}
        update={update}
      />

      {/* ── Footer Links + Contact & Extras ────────────────── */}
      <FooterLinksEditor form={form} update={update} />

      {/* ── SEO & Open Graph ──────────────────────────────── */}
      <SeoSection form={form} update={update} />

      {/* ── Social Links ───────────────────────────────────── */}
      <SocialLinksSection form={form} update={update} />

      {/* ── Hero / Banner ──────────────────────────────────── */}
      <HeroSectionEditor form={form} update={update} />

      {/* ── Save ───────────────────────────────────────────── */}
      <div className="flex justify-end sticky bottom-0 z-20 bg-white border-t px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[160px]"
        >
          {saving ? (
            "Saving…"
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Appearance
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
