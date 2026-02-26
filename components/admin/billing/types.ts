// ─── Shared types for the billing POS module ───────────────────

export type Variant = {
  variantId: number;
  color: string;
  size: string;
  stockCount: number;
  sku: string | null;
  priceModifier: string | null;
  price: string | null;
  mrp: string | null;
};

export type SearchProduct = {
  productId: number;
  productName: string;
  productCode: string;
  basePrice: string;
  mrp: string;
  variants: Variant[];
};

export type CartItem = {
  id: string;
  productId: number;
  variantId: number;
  productName: string;
  color: string;
  size: string;
  sku: string | null;
  price: number;
  mrp: number;
  quantity: number;
  maxStock: number;
  hsn: string;
  itemDiscount: number; // per-item discount in ₹
};

export type InStoreBill = {
  billId: number;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: string;
  paymentMode: string;
  billDate: Date | string;
  items: string;
  discountAmount: string;
  subtotal: string;
};

export type SplitPayment = {
  paymentMode: string;
  amount: string;
  reference: string;
};

export type StoreConfig = {
  enableGst: boolean;
  gstRate: string;
  hsnCode: string;
};

export type HeldBill = {
  cart: CartItem[];
  customer: { name: string; phone: string; gstin: string };
  discount: string;
  notes: string;
  heldAt: string;
};
