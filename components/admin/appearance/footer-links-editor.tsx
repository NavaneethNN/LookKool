"use client";

import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  LayoutList,
  Phone,
  Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { FooterLinkConfig } from "@/lib/site-config-shared";
import { Section, ToggleSwitch, type SiteAppearanceData } from "./shared";

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

// ─── Footer Link Editor (single column) ──────────────────────

function FooterLinkEditorColumn({
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

// ─── Footer Links Editor (full section) ──────────────────────

interface FooterLinksEditorProps {
  form: SiteAppearanceData;
  update: <K extends keyof SiteAppearanceData>(key: K, value: SiteAppearanceData[K]) => void;
}

export function FooterLinksEditor({ form, update }: FooterLinksEditorProps) {
  return (
    <>
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
            <FooterLinkEditorColumn
              links={form.footerQuickLinks}
              onChange={(links) => update("footerQuickLinks", links)}
              addLabel="Add Link"
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Help
            </h4>
            <FooterLinkEditorColumn
              links={form.footerHelpLinks}
              onChange={(links) => update("footerHelpLinks", links)}
              addLabel="Add Link"
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Legal
            </h4>
            <FooterLinkEditorColumn
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
    </>
  );
}
