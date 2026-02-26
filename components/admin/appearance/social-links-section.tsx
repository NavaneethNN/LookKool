"use client";

import {
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Section, type SiteAppearanceData } from "./shared";

interface SocialLinksSectionProps {
  form: SiteAppearanceData;
  update: <K extends keyof SiteAppearanceData>(key: K, value: SiteAppearanceData[K]) => void;
}

export function SocialLinksSection({ form, update }: SocialLinksSectionProps) {
  return (
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
  );
}
