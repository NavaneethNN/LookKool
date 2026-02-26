// Shared order types

export type OrderStatus = "Pending" | "Processing" | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "Refunded";
export type PaymentStatus = "Pending" | "Completed" | "Failed" | "Refunded";
export type ReturnStatus = "Pending" | "Approved" | "Rejected" | "Refunded";

export interface Order {
  orderId: number;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  razorpayPaymentId: string | null;
  totalAmount: string;
  discountAmount: string | null;
  deliveryCharge: string | null;
  couponCode: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  trackingNumber: string | null;
  notes: string | null;
  orderDate: Date | string;
  updatedAt: Date | string;
}

export interface OrderItem {
  orderItemId: number;
  orderId: number;
  productId: number;
  variantId: number;
  productName: string;
  variantColor: string;
  variantSize: string;
  pricePerUnit: string;
  quantity: number;
}

export interface OrderWithUser extends Order {
  user: { name: string; email: string } | null;
  items: { orderItemId: number }[];
}

export interface OrderDetailItem extends OrderItem {
  product: { productId: number; slug: string } | null;
  variant: {
    variantId: number;
    sku: string | null;
    images: { imagePath: string }[];
  } | null;
}

export interface OrderDetail extends Order {
  user: { userId: string; name: string; email: string; phoneNumber: string | null } | null;
  items: OrderDetailItem[];
  returns: ReturnRequest[];
}

export interface ReturnRequest {
  returnId: number;
  orderId: number;
  orderItemId: number;
  userId: string;
  reason: string;
  status: ReturnStatus;
  refundAmount: string | null;
  razorpayRefundId: string | null;
  adminNotes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReturnWithDetails extends ReturnRequest {
  order: { orderId: number; totalAmount: string };
  orderItem: {
    productName: string;
    variantColor: string;
    variantSize: string;
    pricePerUnit: string;
    quantity: number;
  };
  user: { name: string; email: string };
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}
