"use client";

import { Landmark, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SectionProps } from "./types";

export function BankDetailsSection({ form, update }: SectionProps) {
  return (
    <>
      {/* ── Bank Details ──────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Landmark className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            Bank Details
            <span className="text-xs font-normal text-gray-400 ml-2">
              (shown on invoices)
            </span>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Bank Name
            </label>
            <Input
              value={form.bankName ?? ""}
              onChange={(e) => update("bankName", e.target.value)}
              className="h-10"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Account Number
            </label>
            <Input
              value={form.bankAccountNumber ?? ""}
              onChange={(e) => update("bankAccountNumber", e.target.value)}
              className="h-10 font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              IFSC Code
            </label>
            <Input
              value={form.bankIfsc ?? ""}
              onChange={(e) => update("bankIfsc", e.target.value.toUpperCase())}
              className="h-10 font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Branch
            </label>
            <Input
              value={form.bankBranch ?? ""}
              onChange={(e) => update("bankBranch", e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </section>

      {/* ── UPI ───────────────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Smartphone className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">
            UPI Details
          </h3>
        </div>
        <div className="max-w-md">
          <label className="text-xs text-gray-500 mb-1 block">
            UPI ID
          </label>
          <Input
            value={form.upiId ?? ""}
            onChange={(e) => update("upiId", e.target.value)}
            placeholder="yourname@upi"
            className="h-10"
          />
        </div>
      </section>
    </>
  );
}
