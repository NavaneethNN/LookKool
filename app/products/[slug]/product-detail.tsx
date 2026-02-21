"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
  Minus,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Droplets,
  MapPin,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useCartStore, type CartItem } from "@/lib/stores/cart-store";
import { useWishlistStore, type WishlistItem } from "@/lib/stores/wishlist-store";
import { ReviewForm } from "@/components/product/review-form";
import { toast } from "sonner";

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
  isAuthenticated: boolean;
}

// ── Component ────────────────────────────────────────────────

export function ProductDetail({
  product,
  colorVariants,
  reviewSummary,
  recentReviews,
  isAuthenticated,
}: ProductDetailProps) {
  const addToCart = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.productId);

  const [selectedColor, setSelectedColor] = useState(
    colorVariants[0]?.color ?? ""
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    setCurrentImageIndex(0);
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

  function prevImage() {
    setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function nextImage() {
    setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* ── Left: Image Gallery ── */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImageIndex].imagePath}
                alt={
                  images[currentImageIndex].altText ?? product.productName
                }
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm hover:bg-white transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm hover:bg-white transition"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {product.label && (
            <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground shadow-sm">
              {product.label}
            </Badge>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={img.imageId}
                onClick={() => setCurrentImageIndex(idx)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                  currentImageIndex === idx
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <Image
                  src={img.imagePath}
                  alt={img.altText ?? ""}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

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

        {/* Color Selector */}
        {colorVariants.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              Color: <span className="text-muted-foreground">{selectedColor}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {colorVariants.map((cv) => (
                <button
                  key={cv.color}
                  onClick={() => handleColorChange(cv.color)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition",
                    selectedColor === cv.color
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  {cv.hexcode && (
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: cv.hexcode }}
                    />
                  )}
                  {cv.color}
                  {selectedColor === cv.color && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size Selector */}
        {sizes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Size</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.variantId}
                  onClick={() => {
                    setSelectedSize(s.size);
                    setQuantity(1);
                  }}
                  disabled={s.stockCount === 0}
                  className={cn(
                    "h-10 min-w-[3rem] rounded-lg border-2 px-3 text-sm font-medium transition",
                    selectedSize === s.size
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted hover:border-muted-foreground/30",
                    s.stockCount === 0 &&
                      "cursor-not-allowed opacity-40 line-through"
                  )}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        {selectedVariant && !isOutOfStock && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Quantity</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center hover:bg-accent transition rounded-l-lg"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-10 w-12 items-center justify-center border-x text-sm font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedVariant.stockCount, quantity + 1)
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center hover:bg-accent transition rounded-r-lg"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {selectedVariant.stockCount <= 5 && (
                <span className="text-xs text-orange-600 font-medium">
                  Only {selectedVariant.stockCount} left!
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            size="lg"
            className="flex-1 h-12 text-base shadow-lg shadow-primary/25"
            onClick={handleAddToCart}
            disabled={!selectedVariant || isOutOfStock}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-12 shrink-0"
            onClick={handleWishlist}
          >
            <Heart
              className={cn(
                "h-5 w-5",
                wishlisted && "fill-primary text-primary"
              )}
            />
          </Button>
        </div>

        {/* Trust Strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Truck, text: "Free Shipping" },
            { icon: RotateCcw, text: "Easy Returns" },
            { icon: ShieldCheck, text: "Secure Payment" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex flex-col items-center gap-1.5 rounded-xl border bg-muted/30 p-3 text-center"
            >
              <Icon className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs font-medium">{text}</span>
            </div>
          ))}
        </div>

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
            {product.detailHtml ? (
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: product.detailHtml }}
              />
            ) : (
              <div className="space-y-3">
                {product.material && (
                  <div className="flex items-center gap-3 text-sm">
                    <Droplets className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Material:</span>
                    <span className="font-medium">{product.material}</span>
                  </div>
                )}
                {product.fabricWeight && (
                  <div className="flex items-center gap-3 text-sm">
                    <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Fabric Weight:</span>
                    <span className="font-medium">{product.fabricWeight}</span>
                  </div>
                )}
                {product.origin && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Origin:</span>
                    <span className="font-medium">{product.origin}</span>
                  </div>
                )}
                {product.careInstructions && (
                  <div className="flex items-start gap-3 text-sm">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="text-muted-foreground">Care:</span>
                      <p className="font-medium whitespace-pre-line">
                        {product.careInstructions}
                      </p>
                    </div>
                  </div>
                )}
                {!product.material &&
                  !product.fabricWeight &&
                  !product.origin &&
                  !product.careInstructions && (
                    <p className="text-sm text-muted-foreground italic">
                      No details available.
                    </p>
                  )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="pt-4">
            {recentReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              <div className="space-y-5">
                {recentReviews.map((review) => (
                  <div key={review.reviewId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5">
                        <Star className="h-3 w-3 fill-green-700 text-green-700" />
                        <span className="text-xs font-semibold text-green-800">
                          {review.rating}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {review.reviewerName}
                      </span>
                      {review.isVerified && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5"
                        >
                          <Check className="mr-0.5 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {review.reviewText}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <Separator />
                  </div>
                ))}
              </div>
            )}

            {/* Review submission form */}
            <ReviewForm
              productId={product.productId}
              slug={product.slug}
              isAuthenticated={isAuthenticated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
