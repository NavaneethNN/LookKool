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

// Revalidate product pages every 60 seconds
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.productName} – LookKool`,
    description: product.description || `Buy ${product.productName} at LookKool`,
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
    });
  }

  const colorVariants = Array.from(colorMap.values());

  // Check auth for review form
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="container mx-auto px-4 py-8">
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
    </main>
  );
}
