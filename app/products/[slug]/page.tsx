import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  products,
  productVariants,
  productImages,
  reviews,
  categories,
} from "@/db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
import { ProductDetail } from "./product-detail";
import { ProductJsonLd } from "@/components/seo/product-jsonld";
import { createClient } from "@/lib/supabase/server";
import {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getTrendingProducts,
} from "@/lib/actions/recommendation-actions";
import { ProductRecommendationStrip } from "@/components/product/recommendation-strip";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { TrackProductView } from "@/components/product/track-product-view";
import { Sparkles, ShoppingBag, TrendingUp } from "lucide-react";
import { getPublicSiteConfig } from "@/lib/site-config";

// Revalidate product pages every 60 seconds
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [product, siteConfig] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.slug, slug) }),
    getPublicSiteConfig(),
  ]);
  if (!product) return { title: "Product Not Found" };
  const storeName = siteConfig.businessName;
  return {
    title: `${product.productName} – ${storeName}`,
    description: product.description || `Buy ${product.productName} at ${storeName}`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch product
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
  });

  if (!product) notFound();

  // Category
  const category = await db.query.categories.findFirst({
    where: eq(categories.categoryId, product.categoryId),
  });

  // Variants with images
  const variants = await db.query.productVariants.findMany({
    where: eq(productVariants.productId, product.productId),
    with: {
      images: { orderBy: [productImages.sortOrder] },
    },
  });

  // Reviews summary
  const [reviewSummary] = await db
    .select({
      avgRating: avg(reviews.rating),
      totalReviews: count(),
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.productId, product.productId),
        eq(reviews.isApproved, true)
      )
    );

  // Recent reviews
  const recentReviews = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.productId, product.productId),
        eq(reviews.isApproved, true)
      )
    )
    .orderBy(desc(reviews.createdAt))
    .limit(5);

  // Shape variants for client
  const colorMap = new Map<
    string,
    {
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
  >();

  for (const v of variants) {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, {
        color: v.color,
        hexcode: v.hexcode,
        sizes: [],
        images: v.images.map((img: typeof productImages.$inferSelect) => ({
          imageId: img.imageId,
          imagePath: img.imagePath,
          altText: img.altText,
        })),
      });
    }
    colorMap.get(v.color)!.sizes.push({
      variantId: v.variantId,
      size: v.size,
      stockCount: v.stockCount,
      priceModifier: parseFloat(v.priceModifier),
      price: v.price ? parseFloat(v.price) : null,
      mrp: v.mrp ? parseFloat(v.mrp) : null,
    });
  }

  const colorVariants = Array.from(colorMap.values());

  // Check auth for review form
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch recommendations in parallel (non-critical — never crash the page)
  let similarProducts: Awaited<ReturnType<typeof getSimilarProducts>> = [];
  let boughtTogether: Awaited<ReturnType<typeof getFrequentlyBoughtTogether>> = [];
  let trendingProducts: Awaited<ReturnType<typeof getTrendingProducts>> = [];
  let siteConfig: Awaited<ReturnType<typeof getPublicSiteConfig>>;

  try {
    const [sim, bought, trending, config] = await Promise.all([
      getSimilarProducts(product.productId, product.categoryId, 8).catch(() => []),
      getFrequentlyBoughtTogether([product.productId], 6).catch(() => []),
      getTrendingProducts(8).catch(() => []),
      getPublicSiteConfig(),
    ]);
    similarProducts = sim;
    boughtTogether = bought;
    trendingProducts = trending;
    siteConfig = config;
  } catch {
    siteConfig = (await import("@/lib/site-config-shared")).DEFAULT_CONFIG;
  }

  // Filter trending to exclude current product and similar products
  const similarIds = new Set(similarProducts.map((p) => p.productId));
  const filteredTrending = trendingProducts.filter(
    (p) => p.productId !== product.productId && !similarIds.has(p.productId)
  );

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Track this product view for "Recently Viewed" */}
      <TrackProductView productId={product.productId} />
      {/* JSON-LD Structured Data */}
      <ProductJsonLd
        name={product.productName}
        description={product.description}
        slug={product.slug}
        basePrice={parseFloat(product.basePrice)}
        mrp={parseFloat(product.mrp)}
        images={colorVariants.flatMap((cv) =>
          cv.images.map((img) => img.imagePath)
        )}
        avgRating={
          reviewSummary.avgRating
            ? parseFloat(reviewSummary.avgRating)
            : 0
        }
        totalReviews={reviewSummary.totalReviews}
        inStock={colorVariants.some((cv) =>
          cv.sizes.some((s) => s.stockCount > 0)
        )}
        category={category?.categoryName}
        productCode={product.productCode}
        storeName={siteConfig.businessName}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/" className="hover:text-primary transition-colors">
          Home
        </a>
        <span>/</span>
        {category && (
          <>
            <a
              href={`/categories/${category.slug}`}
              className="hover:text-primary transition-colors"
            >
              {category.categoryName}
            </a>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {product.productName}
        </span>
      </nav>

      <ProductDetail
        product={{
          productId: product.productId,
          productName: product.productName,
          slug: product.slug,
          description: product.description,
          basePrice: parseFloat(product.basePrice),
          mrp: parseFloat(product.mrp),
          label: product.label,
          material: product.material,
          fabricWeight: product.fabricWeight,
          careInstructions: product.careInstructions,
          origin: product.origin,
          detailHtml: product.detailHtml,
        }}
        colorVariants={colorVariants}
        reviewSummary={{
          avgRating: reviewSummary.avgRating
            ? parseFloat(reviewSummary.avgRating)
            : 0,
          totalReviews: reviewSummary.totalReviews,
        }}
        recentReviews={recentReviews.map((r) => ({
          reviewId: r.reviewId,
          reviewerName: r.reviewerName,
          rating: r.rating,
          reviewText: r.reviewText,
          isVerified: r.isVerified,
          createdAt: r.createdAt.toISOString(),
        }))}
        isAuthenticated={!!user}
      />

      {/* ── Recommendation Sections ───────────────────────── */}
      <div className="mt-16 space-y-12">
        {/* Frequently Bought Together */}
        {boughtTogether.length > 0 && (
          <ProductRecommendationStrip
            title="Frequently Bought Together"
            subtitle="Customers who bought this also purchased"
            products={boughtTogether}
            icon={<ShoppingBag className="h-5 w-5 text-muted-foreground" />}
            layout="scroll"
            variant="muted"
          />
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <ProductRecommendationStrip
            title="You May Also Like"
            subtitle={`More from ${category?.categoryName ?? "this category"}`}
            products={similarProducts}
            icon={<Sparkles className="h-5 w-5 text-muted-foreground" />}
            layout="scroll"
          />
        )}

        {/* Trending Products */}
        {filteredTrending.length > 0 && (
          <ProductRecommendationStrip
            title="Trending Now"
            subtitle="Popular picks from our store"
            products={filteredTrending}
            icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
            layout="scroll"
            variant="accent"
          />
        )}

        {/* Recently Viewed */}
        <RecentlyViewed excludeIds={[product.productId]} />
      </div>
    </main>
  );
}
