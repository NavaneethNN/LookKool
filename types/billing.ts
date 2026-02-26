// Shared billing / POS types

export interface InStoreBill {
  billId: number;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerGstin: string | null;
  subtotal: string;
  discountAmount: string;
  taxableAmount: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  roundOff: string;
  totalAmount: string;
  paymentMode: string;
  items: string; // JSON string of BillLineItem[]
  createdBy: string;
  notes: string | null;
  billDate: Date | string;
}

export interface BillLineItem {
  variantId?: number;
  productName: string;
  variant?: string;
  color?: string;
  size?: string;
  sku?: string;
  hsn?: string;
  rate: number;
  mrp?: number;
  quantity: number;
  amount: number;
}

export interface SplitPayment {
  paymentMode: string;
  amount: string;
  reference?: string;
}

export interface POSCartItem {
  variantId: number;
  productId: number;
  productName: string;
  productCode: string;
  color: string;
  size: string;
  sku: string | null;
  barcode: string | null;
  rate: number;
  mrp: number;
  quantity: number;
  stock: number;
  discount: number;
}

export interface BillReturn {
  billReturnId: number;
  originalBillId: number;
  returnType: "return" | "exchange";
  returnedItems: string; // JSON
  refundAmount: string;
  exchangeBillId: number | null;
  reason: string | null;
  processedBy: string;
  createdAt: Date | string;
}

export interface ReturnedItem {
  variantId: number;
  productName: string;
  variant: string;
  quantity: number;
  rate: number;
}

/** Held bill (stored in client state) */
export interface HeldBill {
  id: string;
  customerName: string;
  items: POSCartItem[];
  heldAt: string;
  note?: string;
}
