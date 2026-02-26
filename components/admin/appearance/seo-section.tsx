"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/admin/image-upload";
import { Section, type SiteAppearanceData } from "./shared";

interface SeoSectionProps {
  form: SiteAppearanceData;
  update: <K extends keyof SiteAppearanceData>(key: K, value: SiteAppearanceData[K]) => void;
}

export function SeoSection({ form, update }: SeoSectionProps) {
  return (
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
            Twitter, etc. Recommended: 1200x630px.
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
  );
}
