"use server";

import { db } from "@/db";
import { deliverySettings, storeSettings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, requireAdminOrCashier } from "@/lib/admin/require-admin";

// ═══════════════════════════════════════════════════════════════
// SETTINGS (Delivery)
// ═══════════════════════════════════════════════════════════════

export async function getDeliverySettings() {
  await requireAdmin();

  return db.select().from(deliverySettings).orderBy(asc(deliverySettings.settingId));
}

export async function upsertDeliverySetting(data: {
  settingId?: number;
  label: string;
  minOrderAmount: string;
  deliveryCharge: string;
  isFreeDelivery: boolean;
  stateCode?: string;
  isActive: boolean;
}) {
  await requireAdmin();

  const minOrderAmount = data.minOrderAmount || "0.00";
  const deliveryCharge = data.deliveryCharge || "0.00";

  if (data.settingId) {
    await db
      .update(deliverySettings)
      .set({
        label: data.label,
        minOrderAmount,
        deliveryCharge,
        isFreeDelivery: data.isFreeDelivery,
        stateCode: data.stateCode || null,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(deliverySettings.settingId, data.settingId));
  } else {
    await db.insert(deliverySettings).values({
      label: data.label,
      minOrderAmount,
      deliveryCharge,
      isFreeDelivery: data.isFreeDelivery,
      stateCode: data.stateCode || null,
      isActive: data.isActive,
    });
  }

  revalidatePath("/studio/settings");
  revalidateTag("delivery-config");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// STORE SETTINGS (Billing / GST)
// ═══════════════════════════════════════════════════════════════

export async function getStoreSettings() {
  await requireAdminOrCashier();

  const [settings] = await db.select().from(storeSettings).limit(1);
  return settings ?? null;
}

export async function upsertStoreSettings(data: {
  businessName: string;
  businessTagline?: string;
  gstin?: string;
  pan?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstRate: string;
  hsnCode: string;
  enableGst: boolean;
  invoicePrefix: string;
  nextInvoiceNumber?: number;
  invoiceTerms?: string;
  invoiceNotes?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  upiId?: string;
  // Bill layout customization
  billPaperSize?: string;
  billAccentColor?: string;
  billTitle?: string;
  billHeaderText?: string;
  billFooterText?: string;
  billGreeting?: string;
  billLogoUrl?: string;
  billShowLogo?: boolean;
  billShowHsn?: boolean;
  billShowSku?: boolean;
  billShowGstSummary?: boolean;
  billShowBankDetails?: boolean;
  billShowSignatory?: boolean;
  billShowAmountWords?: boolean;
  billShowCustomerSection?: boolean;
  billFontScale?: string;
  billExtraConfig?: Record<string, unknown>;
}) {
  await requireAdmin();

  const nullableFields = {
    businessTagline: data.businessTagline || null,
    gstin: data.gstin || null,
    pan: data.pan || null,
    addressLine1: data.addressLine1 || null,
    addressLine2: data.addressLine2 || null,
    pincode: data.pincode || null,
    country: data.country || "India",
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    invoiceTerms: data.invoiceTerms || null,
    invoiceNotes: data.invoiceNotes || null,
    bankName: data.bankName || null,
    bankAccountNumber: data.bankAccountNumber || null,
    bankIfsc: data.bankIfsc || null,
    bankBranch: data.bankBranch || null,
    upiId: data.upiId || null,
    billHeaderText: data.billHeaderText || null,
    billFooterText: data.billFooterText || null,
    billGreeting: data.billGreeting || null,
    billLogoUrl: data.billLogoUrl || null,
    billExtraConfig: data.billExtraConfig || null,
  };

  const [existing] = await db.select({ settingId: storeSettings.settingId }).from(storeSettings).limit(1);

  const safeFields = {
    businessName: data.businessName,
    city: data.city,
    state: data.state,
    stateCode: data.stateCode,
    gstRate: data.gstRate || "5.00",
    hsnCode: data.hsnCode,
    enableGst: data.enableGst,
    invoicePrefix: data.invoicePrefix,
    // Bill layout — guard NOT NULL columns with defaults
    billPaperSize: data.billPaperSize || "A4",
    billAccentColor: data.billAccentColor || "#470B49",
    billTitle: data.billTitle || "TAX INVOICE",
    billFontScale: data.billFontScale || "1.00",
    billShowLogo: data.billShowLogo ?? false,
    billShowHsn: data.billShowHsn ?? true,
    billShowSku: data.billShowSku ?? true,
    billShowGstSummary: data.billShowGstSummary ?? true,
    billShowBankDetails: data.billShowBankDetails ?? true,
    billShowSignatory: data.billShowSignatory ?? true,
    billShowAmountWords: data.billShowAmountWords ?? true,
    billShowCustomerSection: data.billShowCustomerSection ?? true,
  };

  if (existing) {
    await db
      .update(storeSettings)
      .set({
        ...safeFields,
        ...nullableFields,
        nextInvoiceNumber: typeof data.nextInvoiceNumber === "number" && data.nextInvoiceNumber > 0
          ? data.nextInvoiceNumber
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.settingId, existing.settingId));
  } else {
    await db.insert(storeSettings).values({
      ...safeFields,
      ...nullableFields,
      nextInvoiceNumber: typeof data.nextInvoiceNumber === "number" && data.nextInvoiceNumber > 0
        ? data.nextInvoiceNumber
        : 1,
    });
  }

  revalidatePath("/studio/settings");
  revalidatePath("/", "layout");
  // Bust cached site config so storefront picks up changes immediately
  revalidateTag("site-config");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// POLICY SETTINGS
// ═══════════════════════════════════════════════════════════════

export async function savePolicySettings(data: {
  returnPolicy: string;
  returnWindowDays: number;
  cancellationPolicy: string;
  codEnabled: boolean;
  autoRefundEnabled: boolean;
}) {
  await requireAdmin();

  // Validate inputs
  if (!["accept", "no_returns"].includes(data.returnPolicy)) {
    throw new Error("Invalid return policy value");
  }
  if (!["anytime", "before_shipment", "no_cancellation"].includes(data.cancellationPolicy)) {
    throw new Error("Invalid cancellation policy value");
  }
  if (data.returnWindowDays < 1 || data.returnWindowDays > 90) {
    throw new Error("Return window must be between 1 and 90 days");
  }

  const [existing] = await db.select({ settingId: storeSettings.settingId }).from(storeSettings).limit(1);

  if (existing) {
    await db
      .update(storeSettings)
      .set({
        returnPolicy: data.returnPolicy,
        returnWindowDays: data.returnWindowDays,
        cancellationPolicy: data.cancellationPolicy,
        codEnabled: data.codEnabled,
        autoRefundEnabled: data.autoRefundEnabled,
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.settingId, existing.settingId));
  } else {
    await db.insert(storeSettings).values({
      returnPolicy: data.returnPolicy,
      returnWindowDays: data.returnWindowDays,
      cancellationPolicy: data.cancellationPolicy,
      codEnabled: data.codEnabled,
      autoRefundEnabled: data.autoRefundEnabled,
    });
  }

  revalidatePath("/studio/settings");
  revalidateTag("site-config");
  return { success: true };
}

/**
 * Get policy settings (public-safe — no admin check).
 * Used by checkout page and customer-facing pages.
 */
export async function getPolicySettings() {
  const [row] = await db
    .select({
      returnPolicy: storeSettings.returnPolicy,
      returnWindowDays: storeSettings.returnWindowDays,
      cancellationPolicy: storeSettings.cancellationPolicy,
      codEnabled: storeSettings.codEnabled,
      autoRefundEnabled: storeSettings.autoRefundEnabled,
    })
    .from(storeSettings)
    .limit(1);

  return row ?? {
    returnPolicy: "accept",
    returnWindowDays: 7,
    cancellationPolicy: "before_shipment",
    codEnabled: true,
    autoRefundEnabled: true,
  };
}

// ═══════════════════════════════════════════════════════════════
// SITE APPEARANCE
// ═══════════════════════════════════════════════════════════════

export async function upsertSiteAppearance(data: {
  siteLogoUrl?: string | null;
  sitePrimaryColor?: string;
  siteDescription?: string | null;
  footerTagline?: string | null;
  navLinksConfig?: { label: string; href: string; enabled: boolean }[] | null;
  footerQuickLinks?: { label: string; href: string }[] | null;
  footerHelpLinks?: { label: string; href: string }[] | null;
  footerLegalLinks?: { label: string; href: string }[] | null;
  footerContactPhone?: string | null;
  footerContactEmail?: string | null;
  footerShowMadeInIndia?: boolean;
  // SEO
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  // Social
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;
  // Hero
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroBadgeText?: string | null;
  heroCtaText?: string | null;
  heroCtaLink?: string | null;
  heroSecondaryCtaText?: string | null;
  heroSecondaryCtaLink?: string | null;
}) {
  await requireAdmin();

  const payload = {
    siteLogoUrl: data.siteLogoUrl || null,
    sitePrimaryColor: data.sitePrimaryColor || "#470B49",
    siteDescription: data.siteDescription || null,
    footerTagline: data.footerTagline || null,
    navLinksConfig: data.navLinksConfig ?? null,
    footerQuickLinks: data.footerQuickLinks ?? null,
    footerHelpLinks: data.footerHelpLinks ?? null,
    footerLegalLinks: data.footerLegalLinks ?? null,
    footerContactPhone: data.footerContactPhone || null,
    footerContactEmail: data.footerContactEmail || null,
    footerShowMadeInIndia: data.footerShowMadeInIndia ?? true,
    // SEO
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    seoKeywords: data.seoKeywords || null,
    ogImageUrl: data.ogImageUrl || null,
    // Social
    socialInstagram: data.socialInstagram || null,
    socialFacebook: data.socialFacebook || null,
    socialTwitter: data.socialTwitter || null,
    socialYoutube: data.socialYoutube || null,
    // Hero
    heroTitle: data.heroTitle || null,
    heroSubtitle: data.heroSubtitle || null,
    heroBadgeText: data.heroBadgeText || null,
    heroCtaText: data.heroCtaText || null,
    heroCtaLink: data.heroCtaLink || null,
    heroSecondaryCtaText: data.heroSecondaryCtaText || null,
    heroSecondaryCtaLink: data.heroSecondaryCtaLink || null,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ settingId: storeSettings.settingId })
    .from(storeSettings)
    .limit(1);

  if (existing) {
    await db
      .update(storeSettings)
      .set(payload)
      .where(eq(storeSettings.settingId, existing.settingId));
  } else {
    // Create a minimal row if none exists yet
    await db.insert(storeSettings).values({
      businessName: "LookKool",
      city: "",
      state: "Tamil Nadu",
      stateCode: "33",
      gstRate: "5.00",
      hsnCode: "6104",
      enableGst: true,
      invoicePrefix: "LK",
      ...payload,
    });
  }

  // Revalidate storefront and admin settings
  revalidatePath("/", "layout");
  revalidatePath("/studio/settings");
  revalidateTag("site-config");
  return { success: true };
}
