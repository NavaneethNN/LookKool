"use client";

import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SectionProps } from "./types";

export function BusinessInfoSection({ form, update }: SectionProps) {
  return (
    <section className="rounded-xl border bg-white shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-gray-900">
          Business Identity
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Business Name *
          </label>
          <Input
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            className="h-10"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Tagline
          </label>
          <Input
            value={form.businessTagline ?? ""}
            onChange={(e) => update("businessTagline", e.target.value)}
            placeholder="e.g. Fashion for Everyone"
            className="h-10"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            GSTIN
          </label>
          <Input
            value={form.gstin ?? ""}
            onChange={(e) => update("gstin", e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            className="h-10 font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            PAN
          </label>
          <Input
            value={form.pan ?? ""}
            onChange={(e) => update("pan", e.target.value.toUpperCase())}
            placeholder="AAAAA0000A"
            maxLength={10}
            className="h-10 font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Phone
          </label>
          <Input
            value={form.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            className="h-10"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Email
          </label>
          <Input
            value={form.email ?? ""}
            onChange={(e) => update("email", e.target.value)}
            placeholder="billing@yourdomain.com"
            className="h-10"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">
            Website
          </label>
          <Input
            value={form.website ?? ""}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://yourdomain.com"
            className="h-10"
          />
        </div>
      </div>
    </section>
  );
}
