// Shared cart & wishlist types

export interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  slug: string;
  color: string;
  hexcode: string | null;
  size: string;
  price: number;
  mrp: number;
  image: string;
  quantity: number;
  stock: number;
}

export interface WishlistItem {
  productId: number;
  productName: string;
  slug: string;
  basePrice: number;
  mrp: number;
  image: string;
  label: string | null;
}
