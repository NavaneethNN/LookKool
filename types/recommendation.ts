// Shared recommendation types (used across 10+ components)

export interface RecommendedProduct {
  productId: number;
  productName: string;
  slug: string;
  basePrice: number;
  mrp: number;
  label: string | null;
  image: string;
  rating?: number;
  reviewCount?: number;
}

export interface UpsellProduct extends RecommendedProduct {
  totalOrdered: number;
  recentOrders: number;
  totalStock: number;
  discountPercent: number;
}
