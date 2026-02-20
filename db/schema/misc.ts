import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  boolean,
  decimal,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Enums ─────────────────────────────────────────────────────

export const billTypeEnum = pgEnum("bill_type", [
  "online",
  "in_store",
]);

// ─── Tables ────────────────────────────────────────────────────

/**
 * newsletter
 * Simple email subscription list with GDPR-friendly unsubscribe tracking.
 */
export const newsletter = pgTable("newsletter", {
  newsletterId: serial("newsletter_id").primaryKey(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  isSubscribed: boolean("is_subscribed").notNull().default(true),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

/**
 * delivery_settings
 * Admin-configurable delivery charge rules, replacing hardcoded logic.
 * Rules are evaluated in order: first matching rule wins.
 * - null state_code = applies globally
 * - is_free_delivery = override to ₹0 when order qualifies
 */
export const deliverySettings = pgTable("delivery_settings", {
  settingId: serial("setting_id").primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  // Minimum order subtotal for this rule to apply
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  isFreeDelivery: boolean("is_free_delivery").notNull().default(false),
  // null = applies to all states
  stateCode: varchar("state_code", { length: 10 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * store_settings
 * Single-row config table for store-wide billing/GST settings.
 * Always use settingId = 1 (upsert pattern).
 */
export const storeSettings = pgTable("store_settings", {
  settingId: serial("setting_id").primaryKey(),
  // Business identity
  businessName: varchar("business_name", { length: 255 }).notNull().default("LookKool"),
  businessTagline: varchar("business_tagline", { length: 255 }),
  gstin: varchar("gstin", { length: 15 }),
  pan: varchar("pan", { length: 10 }),
  // Business address
  addressLine1: varchar("address_line1", { length: 255 }),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull().default(""),
  state: varchar("state", { length: 100 }).notNull().default("Tamil Nadu"),
  stateCode: varchar("state_code", { length: 5 }).notNull().default("33"),
  pincode: varchar("pincode", { length: 10 }),
  country: varchar("country", { length: 100 }).notNull().default("India"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 150 }),
  website: varchar("website", { length: 255 }),
  // GST configuration
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  hsnCode: varchar("hsn_code", { length: 20 }).notNull().default("6104"),
  // If seller & buyer are in same state → CGST + SGST, else IGST
  // For TN shop, default is intra-state (CGST + SGST)
  enableGst: boolean("enable_gst").notNull().default(true),
  // Invoice prefix & numbering
  invoicePrefix: varchar("invoice_prefix", { length: 20 }).notNull().default("LK"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  // Terms & notes printed on invoices
  invoiceTerms: text("invoice_terms"),
  invoiceNotes: text("invoice_notes"),
  // Bank details for invoice
  bankName: varchar("bank_name", { length: 255 }),
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  bankIfsc: varchar("bank_ifsc", { length: 20 }),
  bankBranch: varchar("bank_branch", { length: 255 }),
  upiId: varchar("upi_id", { length: 100 }),
  // ── Bill layout customization ──────────────────────────
  // Paper size: A4, A5, thermal-80mm, thermal-58mm
  billPaperSize: varchar("bill_paper_size", { length: 20 }).notNull().default("A4"),
  // Accent color for bill header/footer
  billAccentColor: varchar("bill_accent_color", { length: 10 }).notNull().default("#470B49"),
  // Invoice title (e.g. "TAX INVOICE", "RETAIL BILL", "ESTIMATE")
  billTitle: varchar("bill_title", { length: 100 }).notNull().default("TAX INVOICE"),
  // Custom header text (shown below logo/business name)
  billHeaderText: text("bill_header_text"),
  // Custom footer text (replaces default "Computer generated bill")
  billFooterText: text("bill_footer_text"),
  // Greeting / custom word at the bottom (e.g. "Thank you for shopping!")
  billGreeting: text("bill_greeting"),
  // Logo URL (shown on invoice)
  billLogoUrl: varchar("bill_logo_url", { length: 500 }),
  // Toggle sections on/off
  billShowLogo: boolean("bill_show_logo").notNull().default(false),
  billShowHsn: boolean("bill_show_hsn").notNull().default(true),
  billShowSku: boolean("bill_show_sku").notNull().default(true),
  billShowGstSummary: boolean("bill_show_gst_summary").notNull().default(true),
  billShowBankDetails: boolean("bill_show_bank_details").notNull().default(true),
  billShowSignatory: boolean("bill_show_signatory").notNull().default(true),
  billShowAmountWords: boolean("bill_show_amount_words").notNull().default(true),
  billShowCustomerSection: boolean("bill_show_customer_section").notNull().default(true),
  // Font size multiplier (0.8 = smaller, 1.0 = normal, 1.2 = larger)
  billFontScale: decimal("bill_font_scale", { precision: 3, scale: 2 }).notNull().default("1.00"),
  // Extra columns / labels (JSON config for advanced users)
  billExtraConfig: jsonb("bill_extra_config"),

  // ── Site appearance ──────────────────────────────────────────
  // Storefront logo (separate from bill logo)
  siteLogoUrl: varchar("site_logo_url", { length: 500 }),
  // Primary brand color as hex (e.g. "#470B49")
  sitePrimaryColor: varchar("site_primary_color", { length: 20 }).notNull().default("#470B49"),
  // Short description for footer/SEO
  siteDescription: text("site_description"),
  // Tagline shown below logo in the footer
  footerTagline: text("footer_tagline"),
  // JSON: [{label, href, enabled}] — navbar link configuration
  navLinksConfig: jsonb("nav_links_config"),
  // JSON: [{label, href}] — footer quick links section
  footerQuickLinks: jsonb("footer_quick_links"),
  // JSON: [{label, href}] — footer help section
  footerHelpLinks: jsonb("footer_help_links"),
  // JSON: [{label, href}] — footer legal section
  footerLegalLinks: jsonb("footer_legal_links"),
  footerContactPhone: varchar("footer_contact_phone", { length: 30 }),
  footerContactEmail: varchar("footer_contact_email", { length: 150 }),
  footerShowMadeInIndia: boolean("footer_show_made_in_india").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * in_store_bills
 * Bills generated for in-store/walk-in customers.
 * Separate from online orders — lightweight POS-style records.
 */
export const inStoreBills = pgTable("in_store_bills", {
  billId: serial("bill_id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  // Customer info (optional for walk-in)
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerGstin: varchar("customer_gstin", { length: 15 }),
  // Financials
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  taxableAmount: decimal("taxable_amount", { precision: 10, scale: 2 }).notNull(),
  cgstRate: decimal("cgst_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  cgstAmount: decimal("cgst_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  sgstRate: decimal("sgst_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  sgstAmount: decimal("sgst_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  igstRate: decimal("igst_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  igstAmount: decimal("igst_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  roundOff: decimal("round_off", { precision: 5, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  // Payment
  paymentMode: varchar("payment_mode", { length: 30 }).notNull().default("cash"),
  // Serialised JSON of line items
  items: text("items").notNull(),
  // Admin who created the bill
  createdBy: varchar("created_by", { length: 255 }),
  notes: text("notes"),
  billDate: timestamp("bill_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
