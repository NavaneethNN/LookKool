"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore, type CartItem } from "@/lib/stores/cart-store";
import { useWishlistStore, type WishlistItem } from "@/lib/stores/wishlist-store";
import { toast } from "sonner";

import { ImageGallery } from "@/components/product/image-gallery";
import { VariantSelector } from "@/components/product/variant-selector";
import { ProductActionsBar } from "@/components/product/product-actions-bar";
import { ProductSpecs } from "@/components/product/product-specs";
import { ReviewSection } from "@/components/product/review-section";

// ── Types ────────────────────────────────────────────────────

interface ColorVariant {
  color: string;
  hexcode: string | null;
  sizes: {
    variantId: number;
    size: string;
    stockCount: number;
    priceModifier: number;
    price: number | null;
    mrp: number | null;
  }[];
  images: { imageId: number; imagePath: string; altText: string | null }[];
}

interface Review {
  reviewId: number;
  reviewerName: string;
  rating: number;
  reviewText: string;
  isVerified: boolean;
  createdAt: string;
}

interface ProductDetailProps {
  product: {
    productId: number;
    productName: string;
    slug: string;
    description: string | null;
    basePrice: number;
    mrp: number;
    label: string | null;
    material: string | null;
    fabricWeight: string | null;
    careInstructions: string | null;
    origin: string | null;
    detailHtml: string | null;
  };
  colorVariants: ColorVariant[];
  reviewSummary: {
    avgRating: number;
    totalReviews: number;
  };
  recentReviews: Review[];
}

// ── Component ────────────────────────────────────────────────

export function ProductDetail({
  product,
  colorVariants,
  reviewSummary,
  recentReviews,
}: ProductDetailProps) {
  const addToCart = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.productId);

  const [selectedColor, setSelectedColor] = useState(
    colorVariants[0]?.color ?? ""
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Current color data
  const currentColor = useMemo(
    () => colorVariants.find((c) => c.color === selectedColor),
    [colorVariants, selectedColor]
  );

  const images = currentColor?.images ?? [];

  const sizes = useMemo(
    () => currentColor?.sizes ?? [],
    [currentColor]
  );

  // Selected variant
  const selectedVariant = useMemo(
    () => sizes.find((s) => s.size === selectedSize),
    [sizes, selectedSize]
  );

  // Use variant-level price when set, otherwise fall back to product base price + modifier
  const effectivePrice = selectedVariant?.price ?? (product.basePrice + (selectedVariant?.priceModifier ?? 0));
  const effectiveMrp = selectedVariant?.mrp ?? product.mrp;
  const discount =
    effectiveMrp > effectivePrice
      ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100)
      : 0;

  const isOutOfStock = selectedVariant ? selectedVariant.stockCount === 0 : false;

  // Handlers
  function handleColorChange(color: string) {
    setSelectedColor(color);
    setSelectedSize("");
    setQuantity(1);
  }

  function handleSizeChange(size: string) {
    setSelectedSize(size);
    setQuantity(1);
  }

  function handleAddToCart() {
    if (!selectedVariant || !currentColor) {
      toast.error("Please select a size");
      return;
    }
    if (isOutOfStock) {
      toast.error("This variant is out of stock");
      return;
    }
    const item: CartItem = {
      variantId: selectedVariant.variantId,
      productId: product.productId,
      productName: product.productName,
      slug: product.slug,
      color: currentColor.color,
      hexcode: currentColor.hexcode,
      size: selectedVariant.size,
      price: effectivePrice,
      mrp: effectiveMrp,
      image: images[0]?.imagePath ?? "",
      quantity: quantity,
      stock: selectedVariant.stockCount,
    };
    addToCart(item);
    toast.success("Added to cart");
  }

  function handleWishlist() {
    const item: WishlistItem = {
      productId: product.productId,
      productName: product.productName,
      slug: product.slug,
      basePrice: product.basePrice,
      mrp: product.mrp,
      image: images[0]?.imagePath ?? "",
      label: product.label,
    };
    toggleItem(item);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* ── Left: Image Gallery ── */}
      <ImageGallery
        images={images}
        productName={product.productName}
        label={product.label}
      />

      {/* ── Right: Product Info ── */}
      <div className="space-y-6">
        {/* Title & Rating */}
        <div>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            {product.productName}
          </h1>
          {reviewSummary.totalReviews > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1">
                <Star className="h-3.5 w-3.5 fill-green-700 text-green-700" />
                <span className="text-sm font-semibold text-green-800">
                  {reviewSummary.avgRating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {reviewSummary.totalReviews}{" "}
                {reviewSummary.totalReviews === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">
            ₹{effectivePrice.toLocaleString("en-IN")}
          </span>
          {discount > 0 && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                ₹{effectiveMrp.toLocaleString("en-IN")}
              </span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 text-sm font-semibold"
              >
                {discount}% OFF
              </Badge>
            </>
          )}
        </div>

        <Separator />

        {/* Color & Size Selector */}
        <VariantSelector
          colorVariants={colorVariants}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          sizes={sizes}
          selectedSize={selectedSize}
          onSizeChange={handleSizeChange}
        />

        {/* Quantity, CTA Buttons & Trust Strip */}
        <ProductActionsBar
          selectedVariant={selectedVariant ?? null}
          isOutOfStock={isOutOfStock}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          onWishlistToggle={handleWishlist}
          wishlisted={wishlisted}
        />

        <Separator />

        {/* Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
            >
              Reviews ({reviewSummary.totalReviews})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="pt-4">
            {product.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No description available.
              </p>
            )}
          </TabsContent>

          <TabsContent value="details" className="pt-4">
            <ProductSpecs product={product} />
          </TabsContent>

          <TabsContent value="reviews" className="pt-4">
            <ReviewSection
              productId={product.productId}
              slug={product.slug}
              recentReviews={recentReviews}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
