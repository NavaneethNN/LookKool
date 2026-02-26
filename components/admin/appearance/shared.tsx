"use client";

import type { NavLinkConfig, FooterLinkConfig } from "@/lib/site-config-shared";

// ─── Types ────────────────────────────────────────────────────

export type SiteAppearanceData = {
  siteLogoUrl: string;
  sitePrimaryColor: string;
  siteDescription: string;
  footerTagline: string;
  navLinksConfig: NavLinkConfig[];
  footerQuickLinks: FooterLinkConfig[];
  footerHelpLinks: FooterLinkConfig[];
  footerLegalLinks: FooterLinkConfig[];
  footerContactPhone: string;
  footerContactEmail: string;
  footerShowMadeInIndia: boolean;
  // SEO
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImageUrl: string;
  // Social
  socialInstagram: string;
  socialFacebook: string;
  socialTwitter: string;
  socialYoutube: string;
  // Hero
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroSecondaryCtaText: string;
  heroSecondaryCtaLink: string;
};

export type Category = { categoryId: number; categoryName: string; slug: string };

// ─── Section wrapper ──────────────────────────────────────────

export function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────

export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            checked ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              checked ? "translate-x-[18px]" : "translate-x-[3px]"
            }`}
          />
        </button>
      </div>
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}
