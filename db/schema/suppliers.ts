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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ─────────────────────────────────────────────────────

export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "Draft",
  "Ordered",
  "Partial",
  "Received",
  "Cancelled",
]);

export const stockAdjustmentTypeEnum = pgEnum("stock_adjustment_type", [
  "purchase_in",
  "sale_out",
  "return_in",
  "exchange_out",
  "exchange_in",
  "manual_add",
  "manual_remove",
  "damage",
  "opening_stock",
]);

// ─── Tables ────────────────────────────────────────────────────

/**
 * suppliers
 * Supplier / vendor master for purchase management.
 */
export const suppliers = pgTable("suppliers", {
  supplierId: serial("supplier_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 150 }),
  gstin: varchar("gstin", { length: 15 }),
  pan: varchar("pan", { length: 10 }),
  addressLine1: varchar("address_line1", { length: 255 }),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  totalPurchases: decimal("total_purchases", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalPaid: decimal("total_paid", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * purchase_orders
 * Purchase orders placed to suppliers for stock replenishment.
 */
export const purchaseOrders = pgTable("purchase_orders", {
  purchaseOrderId: serial("purchase_order_id").primaryKey(),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliers.supplierId),
  status: purchaseOrderStatusEnum("status").notNull().default("Draft"),
  orderDate: timestamp("order_date", { withTimezone: true }).notNull().defaultNow(),
  expectedDate: timestamp("expected_date", { withTimezone: true }),
  receivedDate: timestamp("received_date", { withTimezone: true }),
  // Financials
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  gstAmount: decimal("gst_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  discount: decimal("discount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  // Supplier invoice reference
  supplierInvoiceNo: varchar("supplier_invoice_no", { length: 100 }),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * purchase_order_items
 * Line items within a purchase order.
 */
export const purchaseOrderItems = pgTable("purchase_order_items", {
  poItemId: serial("po_item_id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.purchaseOrderId, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  variantInfo: varchar("variant_info", { length: 100 }).notNull(), // "Red / M"
  sku: varchar("sku", { length: 100 }),
  orderedQty: integer("ordered_qty").notNull().default(0),
  receivedQty: integer("received_qty").notNull().default(0),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
});

/**
 * stock_adjustments
 * Audit log for every stock movement — purchase, sale, return, manual adjustment.
 */
export const stockAdjustments = pgTable("stock_adjustments", {
  adjustmentId: serial("adjustment_id").primaryKey(),
  variantId: integer("variant_id").notNull(),
  type: stockAdjustmentTypeEnum("type").notNull(),
  // +ve for stock in, -ve for stock out
  quantityChange: integer("quantity_change").notNull(),
  // Stock count after this adjustment
  stockAfter: integer("stock_after").notNull(),
  // Reference to the source (bill ID, PO ID, etc.)
  referenceType: varchar("reference_type", { length: 50 }), // bill, purchase_order, manual
  referenceId: integer("reference_id"),
  reason: text("reason"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * bill_returns
 * Returns/exchanges against in-store bills.
 */
export const billReturns = pgTable("bill_returns", {
  billReturnId: serial("bill_return_id").primaryKey(),
  originalBillId: integer("original_bill_id").notNull(),
  returnType: varchar("return_type", { length: 20 }).notNull().default("return"), // return, exchange
  // Items returned (JSON array)
  returnedItems: text("returned_items").notNull(),
  // Total refund/credit amount
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  // For exchanges — the new bill ID
  exchangeBillId: integer("exchange_bill_id"),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("completed"), // completed, pending
  processedBy: varchar("processed_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * bill_payments
 * Split payments: multiple payment methods against a single bill.
 */
export const billPayments = pgTable("bill_payments", {
  paymentId: serial("payment_id").primaryKey(),
  billId: integer("bill_id").notNull(),
  paymentMode: varchar("payment_mode", { length: 30 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reference: varchar("reference", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.supplierId],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.purchaseOrderId],
  }),
}));
