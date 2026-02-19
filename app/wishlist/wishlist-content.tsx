"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { toast } from "sonner";

export function WishlistContent() {
  const { items, removeItem, clearWishlist } = useWishlistStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Save products you love by tapping the heart icon.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            Explore Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            clearWishlist();
            toast.success("Wishlist cleared");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5">
        {items.map((item) => {
          const discount =
            item.mrp > item.basePrice
              ? Math.round(((item.mrp - item.basePrice) / item.mrp) * 100)
              : 0;

          return (
            <div
              key={item.productId}
              className="group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Image */}
              <Link
                href={`/products/${item.slug}`}
                className="relative block aspect-[3/4] overflow-hidden bg-muted"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}

                {item.label && (
                  <Badge className="absolute left-2.5 top-2.5 bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
                    {item.label}
                  </Badge>
                )}

                {discount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2.5 left-2.5 bg-green-100 text-green-800 text-xs font-semibold"
                  >
                    {discount}% OFF
                  </Badge>
                )}
              </Link>

              {/* Remove button */}
              <button
                onClick={() => {
                  removeItem(item.productId);
                  toast.success("Removed from wishlist");
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Details */}
              <div className="p-3 sm:p-4 space-y-1.5">
                <Link href={`/products/${item.slug}`}>
                  <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item.productName}
                  </h3>
                </Link>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold">
                    ₹{item.basePrice.toLocaleString("en-IN")}
                  </span>
                  {discount > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      ₹{item.mrp.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <Button asChild size="sm" variant="outline" className="w-full mt-2">
                  <Link href={`/products/${item.slug}`}>
                    View Product
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
