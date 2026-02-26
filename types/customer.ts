// Shared customer/user types

export type UserRole = "customer" | "admin" | "cashier";

export interface Customer {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  createdAt: Date | string;
  lastLoginAt: Date | string | null;
}

export interface AdminCustomerListItem extends Customer {
  orderCount: number;
  totalSpent: number;
}

export interface UserAddress {
  addressId: number;
  userId: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}
