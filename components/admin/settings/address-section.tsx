"use client";

import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SectionProps } from "./types";

export function AddressSection({ form, update }: SectionProps) {
  return (
    <section className="rounded-xl border bg-white shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-gray-900">
          Business Address
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">
            Address Line 1
          </label>
          <Input
            value={form.addressLine1 ?? ""}
            onChange={(e) => update("addressLine1", e.target.value)}
            placeholder="Door no, Street name"
            className="h-10"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">
            Address Line 2
          </label>
          <Input
            value={form.addressLine2 ?? ""}
            onChange={(e) => update("addressLine2", e.target.value)}
            placeholder="Area, Landmark"
            className="h-10"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            City *
          </label>
          <Input
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="h-10"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Pincode
          </label>
          <Input
            value={form.pincode ?? ""}
            onChange={(e) => update("pincode", e.target.value)}
            maxLength={6}
            className="h-10"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            State *
          </label>
          <Input
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            className="h-10"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            State Code
          </label>
          <Input
            value={form.stateCode}
            onChange={(e) => update("stateCode", e.target.value)}
            placeholder="33"
            maxLength={5}
            className="h-10 font-mono"
          />
        </div>
      </div>
    </section>
  );
}
