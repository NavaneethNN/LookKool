"use client";

import {
  Megaphone,
  Type,
  MousePointerClick,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Section, type SiteAppearanceData } from "./shared";

interface HeroSectionEditorProps {
  form: SiteAppearanceData;
  update: <K extends keyof SiteAppearanceData>(key: K, value: SiteAppearanceData[K]) => void;
}

export function HeroSectionEditor({ form, update }: HeroSectionEditorProps) {
  return (
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
  );
}
