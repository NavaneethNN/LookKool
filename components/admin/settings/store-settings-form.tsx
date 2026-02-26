"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { upsertStoreSettings } from "@/lib/actions/settings.actions";
import type { StoreSettingsData } from "./types";
import { defaultSettings } from "./types";
import { BusinessInfoSection } from "./business-info-section";
import { AddressSection } from "./address-section";
import { InvoiceSection } from "./invoice-section";
import { BankDetailsSection } from "./bank-details-section";
import { BillCustomizationSection } from "./bill-customization-section";

export function StoreSettingsForm({
  settings,
}: {
  settings: StoreSettingsData | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<StoreSettingsData>({
    ...defaultSettings,
    ...Object.fromEntries(
      Object.entries(settings ?? {}).filter(([, v]) => v !== null && v !== undefined)
    ),
  });
  const [saving, setSaving] = useState(false);

  const update = (field: keyof StoreSettingsData, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await upsertStoreSettings({
        businessName: form.businessName,
        businessTagline: form.businessTagline || undefined,
        gstin: form.gstin || undefined,
        pan: form.pan || undefined,
        addressLine1: form.addressLine1 || undefined,
        addressLine2: form.addressLine2 || undefined,
        city: form.city,
        state: form.state,
        stateCode: form.stateCode,
        pincode: form.pincode || undefined,
        country: form.country,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        gstRate: form.gstRate,
        hsnCode: form.hsnCode,
        enableGst: form.enableGst,
        invoicePrefix: form.invoicePrefix,
        nextInvoiceNumber: form.nextInvoiceNumber,
        invoiceTerms: form.invoiceTerms || undefined,
        invoiceNotes: form.invoiceNotes || undefined,
        bankName: form.bankName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        bankIfsc: form.bankIfsc || undefined,
        bankBranch: form.bankBranch || undefined,
        upiId: form.upiId || undefined,
        // Bill layout customization
        billPaperSize: form.billPaperSize,
        billAccentColor: form.billAccentColor,
        billTitle: form.billTitle,
        billHeaderText: form.billHeaderText || undefined,
        billFooterText: form.billFooterText || undefined,
        billGreeting: form.billGreeting || undefined,
        billLogoUrl: form.billLogoUrl || undefined,
        billShowLogo: form.billShowLogo,
        billShowHsn: form.billShowHsn,
        billShowSku: form.billShowSku,
        billShowGstSummary: form.billShowGstSummary,
        billShowBankDetails: form.billShowBankDetails,
        billShowSignatory: form.billShowSignatory,
        billShowAmountWords: form.billShowAmountWords,
        billShowCustomerSection: form.billShowCustomerSection,
        billFontScale: form.billFontScale,
      });
      if (result.success) {
        toast.success("Store settings saved!");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <BusinessInfoSection form={form} update={update} />
      <AddressSection form={form} update={update} />
      <InvoiceSection form={form} update={update} />
      <BankDetailsSection form={form} update={update} />
      <BillCustomizationSection form={form} update={update} />

      {/* ── Save ──────────────────────────────────── */}
      <div className="flex justify-end sticky bottom-0 z-20 bg-white border-t px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-8 bg-primary hover:bg-primary/90 gap-2 text-sm font-semibold"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Store Settings"}
        </Button>
      </div>
    </div>
  );
}
