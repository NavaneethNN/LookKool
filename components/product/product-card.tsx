"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useWishlistStore,
  type WishlistItem,
} from "@/lib/stores/wishlist-store";
import { toast } from "sonner";
import { useState } from "react";

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
  const discount =
    mrp > basePrice ? Math.round(((mrp - basePrice) / mrp) * 100) : 0;
  const [heartAnimating, setHeartAnimating] = useState(false);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 500);
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
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card card-glow transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/15">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted/50">
          {image ? (
            <Image
              src={image}
              alt={productName}
              fill
              className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Quick view hint on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-4 py-2 text-xs font-medium text-foreground shadow-lg translate-y-3 transition-transform duration-500 group-hover:translate-y-0">
              <Eye className="h-3.5 w-3.5" />
              Quick View
            </div>
          </div>

          {/* Label Badge */}
          {label && (
            <Badge className="absolute left-2.5 top-2.5 bg-primary text-primary-foreground text-[11px] font-semibold shadow-md shadow-primary/20 rounded-lg px-2.5">
              {label}
            </Badge>
          )}

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md transition-all duration-300 hover:scale-110"
            onClick={handleWishlist}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all duration-300",
                wishlisted
                  ? "fill-primary text-primary scale-110"
                  : "text-muted-foreground",
                heartAnimating && "animate-heart-beat"
              )}
            />
          </Button>

          {/* Discount Badge */}
          {discount > 0 && (
            <Badge
              variant="secondary"
              className="absolute bottom-2.5 left-2.5 bg-green-50 text-green-700 text-[11px] font-bold border border-green-200/50 rounded-lg px-2"
            >
              {discount}% OFF
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="p-3.5 sm:p-4 space-y-2">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {productName}
          </h3>

          {/* Rating */}
          {rating && rating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 rounded-md bg-green-50 border border-green-100 px-1.5 py-0.5">
                <Star className="h-3 w-3 fill-green-600 text-green-600" />
                <span className="text-[11px] font-bold text-green-700">
                  {rating.toFixed(1)}
                </span>
              </div>
              {reviewCount && reviewCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  ({reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight">
              ₹{basePrice.toLocaleString("en-IN")}
            </span>
            {discount > 0 && (
              <span className="text-xs text-muted-foreground/70 line-through">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* Shine effect overlay */}
        <div className="shine-effect absolute inset-0 pointer-events-none" />
      </div>
    </Link>
  );
}
