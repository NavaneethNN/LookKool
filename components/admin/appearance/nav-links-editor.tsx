"use client";

import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Navigation,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { NavLinkConfig } from "@/lib/site-config-shared";
import { Section, type SiteAppearanceData, type Category } from "./shared";

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

// ─── Nav Links Editor ─────────────────────────────────────────

interface NavLinksEditorProps {
  navLinksConfig: NavLinkConfig[];
  categories: Category[];
  update: <K extends keyof SiteAppearanceData>(key: K, value: SiteAppearanceData[K]) => void;
}

export function NavLinksEditor({ navLinksConfig, categories, update }: NavLinksEditorProps) {
  const moveNavLink = (i: number, dir: -1 | 1) => {
    const arr = [...navLinksConfig];
    const j = i + dir;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update("navLinksConfig", arr);
  };

  return (
    <Section
      icon={<Navigation className="h-4 w-4" />}
      title="Navbar Links"
      description="Control which links appear in the top navigation. Each link must point to Home, Shop All, or a category page."
    >
      <div className="space-y-2">
        {navLinksConfig.map((link, i) => (
          <NavLinkRow
            key={i}
            link={link}
            index={i}
            total={navLinksConfig.length}
            categories={categories}
            onChange={(updated) => {
              const arr = [...navLinksConfig];
              arr[i] = updated;
              update("navLinksConfig", arr);
            }}
            onDelete={() =>
              update(
                "navLinksConfig",
                navLinksConfig.filter((_, idx) => idx !== i)
              )
            }
            onMove={(dir) => moveNavLink(i, dir)}
          />
        ))}
        <button
          type="button"
          onClick={() =>
            update("navLinksConfig", [
              ...navLinksConfig,
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
  );
}
