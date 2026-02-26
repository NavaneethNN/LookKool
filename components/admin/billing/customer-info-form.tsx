"use client";

import { User } from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── Props ─────────────────────────────────────────────────────

export interface CustomerInfoFormProps {
  customerName: string;
  customerPhone: string;
  customerGstin: string;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onCustomerGstinChange: (value: string) => void;
}

// ─── Component ─────────────────────────────────────────────────

export function CustomerInfoForm({
  customerName,
  customerPhone,
  customerGstin,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCustomerGstinChange,
}: CustomerInfoFormProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <User className="w-4 h-4" /> Customer Details
        <span className="text-xs font-normal text-gray-400">(optional)</span>
      </div>
      <div className="space-y-3">
        <Input value={customerName} onChange={(e) => onCustomerNameChange(e.target.value)} placeholder="Customer name" className="h-10" />
        <Input value={customerPhone} onChange={(e) => onCustomerPhoneChange(e.target.value)} placeholder="Phone number" className="h-10" />
        <Input value={customerGstin} onChange={(e) => onCustomerGstinChange(e.target.value.toUpperCase())} placeholder="GSTIN (for B2B)" className="h-10" maxLength={15} />
      </div>
    </div>
  );
}
