"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Users, Sparkles, TrendingUp, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { getUpsellProducts } from "@/lib/actions/recommendation.actions";
import type { UpsellProduct } from "@/lib/actions/recommendation.actions";

// ── Psychology-driven messaging ─────────────────────────────

function getScarcityLabel(stock: number) {
  if (stock <= 0) return null;
  if (stock <= 3) return { text: `Only ${stock} left!`, urgent: true };
  if (stock <= 10) return { text: `Only ${stock} left`, urgent: false };
  return null;
}

function getSocialProofLabel(totalOrdered: number) {
  if (totalOrdered >= 100) return `${totalOrdered}+ sold`;
  if (totalOrdered >= 50) return `${totalOrdered}+ sold`;
  if (totalOrdered >= 10) return `${totalOrdered}+ bought this`;
  return null;
}

function getUrgencyLabel(recentOrders: number) {
  if (recentOrders >= 10) return `🔥 ${recentOrders} bought this week`;
  if (recentOrders >= 3) return `${recentOrders} bought recently`;
  return null;
}

// ── Upsell Card ─────────────────────────────────────────────

function UpsellCard({ product }: { product: UpsellProduct }) {
  const scarcity = getScarcityLabel(product.totalStock);
  const socialProof = getSocialProofLabel(product.totalOrdered);
  const urgency = getUrgencyLabel(product.recentOrders);
  const hasDiscount = product.discountPercent > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex-shrink-0 w-[165px] sm:w-[190px] rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.productName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 165px, 190px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}

        {/* Discount badge — top left (anchoring) */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            -{product.discountPercent}%
          </div>
        )}

        {/* Label badge — top right */}
        {product.label && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
            {product.label}
          </div>
        )}

        {/* Scarcity bar — bottom of image (urgency/loss aversion) */}
        {scarcity && (
          <div
            className={`absolute bottom-0 inset-x-0 text-center text-[10px] font-semibold py-1 ${
              scarcity.urgent
                ? "bg-red-600/90 text-white animate-pulse"
                : "bg-amber-500/90 text-white"
            }`}
          >
            {scarcity.urgent && <Flame className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
            {scarcity.text}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-2.5 space-y-1.5">
        <p className="text-xs font-medium leading-tight line-clamp-2 min-h-[2rem]">
          {product.productName}
        </p>

        {/* Price — anchoring: MRP + sale price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-primary">
            ₹{product.basePrice.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-muted-foreground line-through">
              ₹{product.mrp.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="text-amber-500">★</span>
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount ? (
              <span>({product.reviewCount})</span>
            ) : null}
          </div>
        )}

        {/* Social proof / urgency signal — one line */}
        {(urgency || socialProof) && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
            {urgency ? (
              <>
                <TrendingUp className="h-3 w-3 text-orange-500 shrink-0" />
                <span className="truncate">{urgency}</span>
              </>
            ) : socialProof ? (
              <>
                <Users className="h-3 w-3 text-blue-500 shrink-0" />
                <span className="truncate">{socialProof}</span>
              </>
            ) : null}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Main Upsell Widget ──────────────────────────────────────

interface UpsellWidgetProps {
  /** Heading variant for context */
  variant?: "cart" | "checkout";
  /** Delivery config to compute free shipping gap (optional) */
  deliveryConfig?: { freeAbove: number | null; standardCharge: number };
}

export function UpsellWidget({ variant = "cart", deliveryConfig }: UpsellWidgetProps) {
  const { items, total } = useCartStore();
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cartTotal = total();
  const freeShippingGap =
    deliveryConfig?.freeAbove != null && cartTotal < deliveryConfig.freeAbove
      ? Math.ceil(deliveryConfig.freeAbove - cartTotal)
      : null;

  const cartProductIds = items.map((i) => i.productId);
  const cartIdKey = cartProductIds.sort().join(",");

  useEffect(() => {
    if (!cartIdKey) {
      setLoaded(true);
      return;
    }

    const ids = cartIdKey.split(",").filter(Boolean).map(Number);
    getUpsellProducts(ids, 8)
      .then((prods) => {
        const cartSet = new Set(ids);
        setProducts(prods.filter((p) => !cartSet.has(p.productId)));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [cartIdKey]);

  if (!loaded || products.length === 0 || items.length === 0) return null;

  const isCart = variant === "cart";

  // Contextual headings with psychological framing
  const heading = isCart
    ? "Complete Your Look"
    : "Customers Also Added";
  const subtitle = isCart
    ? "These go perfectly with what's in your cart"
    : "Don't miss these — frequently added at checkout";

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section
      className={`${
        isCart
          ? "mt-10 bg-gradient-to-br from-primary/[0.04] via-background to-primary/[0.02] rounded-2xl p-5 sm:p-7 border border-primary/10"
          : "mt-6 bg-muted/40 rounded-xl p-4 sm:p-5 border"
      }`}
    >
      {/* Free shipping nudge — loss aversion */}
      {freeShippingGap != null && freeShippingGap > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-3 py-2.5 text-sm">
          <span className="text-lg">🚚</span>
          <span className="text-green-800 font-medium">
            Add just <span className="font-bold">₹{freeShippingGap.toLocaleString("en-IN")}</span> more for{" "}
            <span className="font-bold text-green-700">FREE shipping!</span>
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3
            className={`font-bold text-foreground flex items-center gap-2 ${
              isCart ? "text-lg sm:text-xl" : "text-base"
            }`}
          >
            <Sparkles className={`text-primary shrink-0 ${isCart ? "h-5 w-5" : "h-4 w-4"}`} />
            {heading}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>

        {products.length > 3 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center rounded-full border bg-background hover:bg-accent transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center rounded-full border bg-background hover:bg-accent transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Product scroll strip */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div key={product.productId} className="snap-start">
            <UpsellCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
