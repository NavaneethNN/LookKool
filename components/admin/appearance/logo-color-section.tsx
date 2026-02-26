"use client";

import { Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/admin/image-upload";
import { Section, type SiteAppearanceData } from "./shared";

interface LogoColorSectionProps {
  form: SiteAppearanceData;
  update: <K extends keyof SiteAppearanceData>(key: K, value: SiteAppearanceData[K]) => void;
}

export function LogoColorSection({ form, update }: LogoColorSectionProps) {
  return (
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
            background, ~240x80px.
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
  );
}
