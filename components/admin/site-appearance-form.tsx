"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Globe,
  Navigation,
  LayoutList,
  Phone,
  Mail,
  Image as ImageIcon,
  Info,
  Search,
  Share2,
  Megaphone,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  ExternalLink,
  Type,
  MousePointerClick,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/admin/image-upload";
import { upsertSiteAppearance } from "@/lib/actions/admin-actions";
import type { NavLinkConfig, FooterLinkConfig } from "@/lib/site-config-shared";
import {
  DEFAULT_NAV_LINKS,
  DEFAULT_QUICK_LINKS,
  DEFAULT_HELP_LINKS,
  DEFAULT_LEGAL_LINKS,
} from "@/lib/site-config-shared";

// ─── Types ────────────────────────────────────────────────────

type SiteAppearanceData = {
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

type Category = { categoryId: number; categoryName: string; slug: string };

// ─── Section wrapper ──────────────────────────────────────────

function Section({
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

function ToggleSwitch({
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

// ─── Nav Link Row ─────────────────────────────────────────────

function NavLinkRow({
  link,
  index,
  total,
  categories,
  onChange,
  onDelete,
  onMove,
}: {
  link: NavLinkConfig;
  index: number;
  total: number;
  categories: Category[];
  onChange: (updated: NavLinkConfig) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-gray-50/50 p-3">
      {/* Reorder */}
      <div className="flex flex-col gap-0.5 pt-1">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Label */}
      <Input
        value={link.label}
        onChange={(e) => onChange({ ...link, label: e.target.value })}
        placeholder="Label"
        className="h-8 w-28 text-sm"
      />

      {/* Destination picker (only valid pages) */}
      <div className="flex flex-1 gap-1 min-w-0">
        <select
          className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm"
          value={link.href}
          onChange={(e) => {
            const href = e.target.value;
            // Auto-set label for common pages
            if (href === "/" && link.label === "New Link") {
              onChange({ ...link, href, label: "Home" });
            } else if (href === "/shop" && link.label === "New Link") {
              onChange({ ...link, href, label: "Shop All" });
            } else if (href.startsWith("/categories/") && link.label === "New Link") {
              const cat = categories.find((c) => `/categories/${c.slug}` === href);
              onChange({ ...link, href, label: cat?.categoryName || link.label });
            } else {
              onChange({ ...link, href });
            }
          }}
        >
          <option value="/" >🏠 Home</option>
          <option value="/shop">🛍️ Shop All</option>
          {categories.length > 0 && (
            <optgroup label="Categories">
              {categories.map((c) => (
                <option key={c.slug} value={`/categories/${c.slug}`}>
                  📂 {c.categoryName}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Enabled toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...link, enabled: !link.enabled })}
        className={`h-8 rounded-md px-2.5 text-xs font-medium transition-colors ${
          link.enabled
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        {link.enabled ? "Shown" : "Hidden"}
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Footer Link Row ──────────────────────────────────────────

function FooterLinkRow({
  link,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  link: FooterLinkConfig;
  index: number;
  total: number;
  onChange: (updated: FooterLinkConfig) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-gray-50/50 p-2.5">
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <Input
        value={link.label}
        onChange={(e) => onChange({ ...link, label: e.target.value })}
        placeholder="Label"
        className="h-7 w-32 text-sm"
      />
      <Input
        value={link.href}
        onChange={(e) => onChange({ ...link, href: e.target.value })}
        placeholder="/path or URL"
        className="h-7 flex-1 text-sm font-mono"
      />
      <button
        type="button"
        onClick={onDelete}
        className="h-7 w-7 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FooterLinkEditor({
  links,
  onChange,
  addLabel,
}: {
  links: FooterLinkConfig[];
  onChange: (links: FooterLinkConfig[]) => void;
  addLabel: string;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const arr = [...links];
    const j = i + dir;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <FooterLinkRow
          key={i}
          link={link}
          index={i}
          total={links.length}
          onChange={(updated) => {
            const arr = [...links];
            arr[i] = updated;
            onChange(arr);
          }}
          onDelete={() => onChange(links.filter((_, idx) => idx !== i))}
          onMove={(dir) => move(i, dir)}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { label: "", href: "" }])}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
}

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

  const moveNavLink = (i: number, dir: -1 | 1) => {
    const arr = [...form.navLinksConfig];
    const j = i + dir;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update("navLinksConfig", arr);
  };

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
      <Section
        icon={<ImageIcon className="h-4 w-4" />}
        title="Logo & Brand Color"
        description="Customize how your store looks across the site"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Store Logo
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Shown in the navbar and footer. Recommended: PNG with transparent
              background, ~240×80px.
            </p>
            <ImageUpload
              value={form.siteLogoUrl}
              onChange={(url) => update("siteLogoUrl", url)}
              folder="site-assets"
              size={160}
            />
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Primary Brand Color
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Used for buttons, badges, active links, and highlights across the
              entire storefront.
            </p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={form.sitePrimaryColor}
                  onChange={(e) => update("sitePrimaryColor", e.target.value)}
                  className="h-12 w-12 cursor-pointer rounded-lg border border-gray-200 p-1"
                  title="Pick brand color"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={form.sitePrimaryColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v))
                      update("sitePrimaryColor", v);
                  }}
                  placeholder="#470B49"
                  className="font-mono text-sm"
                  maxLength={7}
                />
              </div>
              <div
                className="h-10 w-24 rounded-lg border text-white text-xs font-semibold flex items-center justify-center shadow-sm"
                style={{ backgroundColor: form.sitePrimaryColor }}
              >
                Preview
              </div>
            </div>
          </div>
        </div>
      </Section>

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
      <Section
        icon={<Navigation className="h-4 w-4" />}
        title="Navbar Links"
        description="Control which links appear in the top navigation. Each link must point to Home, Shop All, or a category page."
      >
        <div className="space-y-2">
          {form.navLinksConfig.map((link, i) => (
            <NavLinkRow
              key={i}
              link={link}
              index={i}
              total={form.navLinksConfig.length}
              categories={categories}
              onChange={(updated) => {
                const arr = [...form.navLinksConfig];
                arr[i] = updated;
                update("navLinksConfig", arr);
              }}
              onDelete={() =>
                update(
                  "navLinksConfig",
                  form.navLinksConfig.filter((_, idx) => idx !== i)
                )
              }
              onMove={(dir) => moveNavLink(i, dir)}
            />
          ))}
          <button
            type="button"
            onClick={() =>
              update("navLinksConfig", [
                ...form.navLinksConfig,
                { label: "New Link", href: "/", enabled: true },
              ])
            }
            className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
          >
            <Plus className="h-4 w-4" />
            Add Nav Link
          </button>
        </div>
      </Section>

      {/* ── Footer Links ───────────────────────────────────── */}
      <Section
        icon={<LayoutList className="h-4 w-4" />}
        title="Footer Link Sections"
        description="Customize the three columns of links shown in the footer."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Quick Links
            </h4>
            <FooterLinkEditor
              links={form.footerQuickLinks}
              onChange={(links) => update("footerQuickLinks", links)}
              addLabel="Add Link"
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Help
            </h4>
            <FooterLinkEditor
              links={form.footerHelpLinks}
              onChange={(links) => update("footerHelpLinks", links)}
              addLabel="Add Link"
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Legal
            </h4>
            <FooterLinkEditor
              links={form.footerLegalLinks}
              onChange={(links) => update("footerLegalLinks", links)}
              addLabel="Add Link"
            />
          </div>
        </div>
      </Section>

      {/* ── Footer Contact & Extras ─────────────────────────── */}
      <Section
        icon={<Phone className="h-4 w-4" />}
        title="Footer Contact & Extras"
        description="Contact details shown in the footer brand column."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Contact Phone
            </label>
            <Input
              value={form.footerContactPhone}
              onChange={(e) => update("footerContactPhone", e.target.value)}
              placeholder="+91 98765 43210"
              type="tel"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Contact Email
            </label>
            <Input
              value={form.footerContactEmail}
              onChange={(e) => update("footerContactEmail", e.target.value)}
              placeholder="hello@yourshop.com"
              type="email"
            />
          </div>
        </div>

        <Separator className="my-4" />

        <ToggleSwitch
          label='Show "Made in India" in footer'
          description='Displays the "Made in India with ♥" text in the footer bottom bar.'
          checked={form.footerShowMadeInIndia}
          onChange={(v) => update("footerShowMadeInIndia", v)}
        />
      </Section>

      {/* ── SEO & Open Graph ──────────────────────────────── */}
      <Section
        icon={<Search className="h-4 w-4" />}
        title="SEO & Open Graph"
        description="Control how your store appears in search results and when shared on social media."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              SEO Title
            </label>
            <p className="text-xs text-gray-500">
              Custom title tag for the homepage. Falls back to your Business Name if empty.
            </p>
            <Input
              value={form.seoTitle}
              onChange={(e) => update("seoTitle", e.target.value)}
              placeholder="My Awesome Store – Trendy Fashion Online"
              maxLength={70}
            />
            <p className="text-xs text-gray-400">{form.seoTitle.length}/70 characters</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              SEO Description
            </label>
            <p className="text-xs text-gray-500">
              Custom meta description for search results. Falls back to Shop
              Description if empty.
            </p>
            <textarea
              value={form.seoDescription}
              onChange={(e) => update("seoDescription", e.target.value)}
              rows={2}
              placeholder="Discover trendy, affordable fashion at our store…"
              maxLength={160}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-xs text-gray-400">{form.seoDescription.length}/160 characters</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              SEO Keywords
            </label>
            <p className="text-xs text-gray-500">
              Comma-separated keywords for search engines.
            </p>
            <Input
              value={form.seoKeywords}
              onChange={(e) => update("seoKeywords", e.target.value)}
              placeholder="fashion, women clothing, kurtas, dresses, online shop"
            />
          </div>
          <Separator className="my-2" />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Open Graph Image
            </label>
            <p className="text-xs text-gray-500">
              Image shown when your site link is shared on Facebook, WhatsApp,
              Twitter, etc. Recommended: 1200×630px.
            </p>
            <ImageUpload
              value={form.ogImageUrl}
              onChange={(url) => update("ogImageUrl", url)}
              folder="site-assets"
              size={200}
            />
          </div>
        </div>
      </Section>

      {/* ── Social Links ───────────────────────────────────── */}
      <Section
        icon={<Share2 className="h-4 w-4" />}
        title="Social Media Links"
        description="Add links to your social profiles. These are shown in the footer."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Instagram className="h-3.5 w-3.5" />
              Instagram
            </label>
            <Input
              value={form.socialInstagram}
              onChange={(e) => update("socialInstagram", e.target.value)}
              placeholder="https://instagram.com/yourshop"
              type="url"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Facebook className="h-3.5 w-3.5" />
              Facebook
            </label>
            <Input
              value={form.socialFacebook}
              onChange={(e) => update("socialFacebook", e.target.value)}
              placeholder="https://facebook.com/yourshop"
              type="url"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Twitter className="h-3.5 w-3.5" />
              Twitter / X
            </label>
            <Input
              value={form.socialTwitter}
              onChange={(e) => update("socialTwitter", e.target.value)}
              placeholder="https://x.com/yourshop"
              type="url"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Youtube className="h-3.5 w-3.5" />
              YouTube
            </label>
            <Input
              value={form.socialYoutube}
              onChange={(e) => update("socialYoutube", e.target.value)}
              placeholder="https://youtube.com/@yourshop"
              type="url"
            />
          </div>
        </div>
      </Section>

      {/* ── Hero / Banner ──────────────────────────────────── */}
      <Section
        icon={<Megaphone className="h-4 w-4" />}
        title="Hero Banner"
        description="Customize the main banner on the homepage. Leave fields empty to use defaults."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              Badge Text
            </label>
            <p className="text-xs text-gray-500">
              Small badge shown above the title (e.g. &quot;New Collection 2026&quot;).
            </p>
            <Input
              value={form.heroBadgeText}
              onChange={(e) => update("heroBadgeText", e.target.value)}
              placeholder="New Collection 2026"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Hero Title
            </label>
            <p className="text-xs text-gray-500">
              Main heading on the homepage hero. Leave empty for default.
            </p>
            <Input
              value={form.heroTitle}
              onChange={(e) => update("heroTitle", e.target.value)}
              placeholder="Stay Kool, Look Kool"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Hero Subtitle
            </label>
            <textarea
              value={form.heroSubtitle}
              onChange={(e) => update("heroSubtitle", e.target.value)}
              rows={2}
              placeholder="Your go-to women's boutique for trendy, affordable fashion."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Separator className="my-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" />
                Primary Button Text
              </label>
              <Input
                value={form.heroCtaText}
                onChange={(e) => update("heroCtaText", e.target.value)}
                placeholder="Shop Now"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Primary Button Link
              </label>
              <Input
                value={form.heroCtaLink}
                onChange={(e) => update("heroCtaLink", e.target.value)}
                placeholder="/categories/women"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Secondary Button Text
              </label>
              <Input
                value={form.heroSecondaryCtaText}
                onChange={(e) => update("heroSecondaryCtaText", e.target.value)}
                placeholder="New Arrivals"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Secondary Button Link
              </label>
              <Input
                value={form.heroSecondaryCtaLink}
                onChange={(e) => update("heroSecondaryCtaLink", e.target.value)}
                placeholder="/new-arrivals"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Save ───────────────────────────────────────────── */}
      <div className="flex justify-end">
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
