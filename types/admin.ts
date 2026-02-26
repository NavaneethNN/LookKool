// Shared admin/settings types

export interface StoreSettings {
  settingId: number;
  businessName: string;
  businessTagline: string | null;
  gstin: string | null;
  pan: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string;
  state: string;
  stateCode: string;
  pincode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  gstRate: string;
  hsnCode: string;
  enableGst: boolean;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  invoiceTerms: string | null;
  invoiceNotes: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankBranch: string | null;
  upiId: string | null;
  // Bill customization
  billPaperSize: string | null;
  billAccentColor: string | null;
  billTitle: string | null;
  billHeaderText: string | null;
  billFooterText: string | null;
  billGreeting: string | null;
  billLogoUrl: string | null;
  billShowLogo: boolean | null;
  billShowHsn: boolean | null;
  billShowSku: boolean | null;
  billShowGstSummary: boolean | null;
  billShowBankDetails: boolean | null;
  billShowSignatory: boolean | null;
  billShowAmountWords: boolean | null;
  billShowCustomerSection: boolean | null;
  billFontScale: string | null;
  billExtraConfig: Record<string, unknown> | null;
  // Site appearance
  siteLogoUrl: string | null;
  sitePrimaryColor: string | null;
  siteDescription: string | null;
  footerTagline: string | null;
  // Policy
  returnPolicy: string | null;
  returnWindowDays: number | null;
  cancellationPolicy: string | null;
  codEnabled: boolean | null;
  autoRefundEnabled: boolean | null;
  updatedAt: Date | string;
}

export interface SiteAppearanceData {
  siteLogoUrl?: string | null;
  sitePrimaryColor?: string;
  siteDescription?: string | null;
  footerTagline?: string | null;
  navLinksConfig?: NavLink[] | null;
  footerQuickLinks?: FooterLink[] | null;
  footerHelpLinks?: FooterLink[] | null;
  footerLegalLinks?: FooterLink[] | null;
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
}

export interface NavLink {
  label: string;
  href: string;
  enabled: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface DeliveryRule {
  settingId?: number;
  label: string;
  minOrderAmount: string;
  deliveryCharge: string;
  isFreeDelivery: boolean;
  stateCode?: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingReturns: number;
  totalReviews: number;
  todayOrders: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface PolicySettings {
  returnPolicy: string;
  returnWindowDays: number;
  cancellationPolicy: string;
  codEnabled: boolean;
  autoRefundEnabled: boolean;
}
