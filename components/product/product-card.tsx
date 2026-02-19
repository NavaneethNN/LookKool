"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlistStore, type WishlistItem } from "@/lib/stores/wishlist-store";
import { toast } from "sonner";

interface ProductCardProps {
  productId: number;
  productName: string;
  slug: string;
  basePrice: number;
  mrp: number;
  image: string;
  label?: string | null;
  rating?: number;
  reviewCount?: number;
}

export function ProductCard({
  productId,
  productName,
  slug,
  basePrice,
  mrp,
  image,
  label,
  rating,
  reviewCount,
}: ProductCardProps) {
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(productId);
  const discount = mrp > basePrice ? Math.round(((mrp - basePrice) / mrp) * 100) : 0;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item: WishlistItem = {
      productId,
      productName,
      slug,
      basePrice,
      mrp,
      image,
      label: label ?? null,
    };
    toggleItem(item);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={productName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Label Badge */}
          {label && (
            <Badge className="absolute left-2.5 top-2.5 bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
              {label}
            </Badge>
          )}

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white"
            onClick={handleWishlist}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                wishlisted ? "fill-primary text-primary" : "text-muted-foreground"
              )}
            />
          </Button>

          {/* Discount Badge */}
          {discount > 0 && (
            <Badge
              variant="secondary"
              className="absolute bottom-2.5 left-2.5 bg-green-100 text-green-800 text-xs font-semibold"
            >
              {discount}% OFF
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="p-3 sm:p-4 space-y-1.5">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {productName}
          </h3>

          {/* Rating */}
          {rating && rating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5">
                <Star className="h-3 w-3 fill-green-700 text-green-700" />
                <span className="text-xs font-semibold text-green-800">
                  {rating.toFixed(1)}
                </span>
              </div>
              {reviewCount && reviewCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold">
              ₹{basePrice.toLocaleString("en-IN")}
            </span>
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
