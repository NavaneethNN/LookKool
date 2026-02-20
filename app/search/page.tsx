import { Metadata } from "next";
import { db } from "@/db";
import { products, productVariants, productImages, categories } from "@/db/schema";
import { eq, and, or, ilike, sql, desc } from "drizzle-orm";
import { SearchContent } from "./search-content";
import { getTrendingProducts, getPopularProducts } from "@/lib/actions/recommendation-actions";

// Disable caching for search (depends on query params)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search – LookKool",
  description: "Search for products on LookKool.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "", category } = await searchParams;

  // Fetch all active categories for filter
  const allCategories = await db
    .select({
      categoryId: categories.categoryId,
      categoryName: categories.categoryName,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);

  let productList: {
    productId: number;
    productName: string;
    slug: string;
    basePrice: number;
    mrp: number;
    label: string | null;
    image: string;
  }[] = [];

  if (q.trim().length > 0) {
    const searchTerm = `%${q.trim()}%`;

    // Build where conditions
    const conditions = [
      eq(products.isActive, true),
      or(
        ilike(products.productName, searchTerm),
        ilike(products.description, searchTerm),
        ilike(products.productCode, searchTerm)
      ),
    ];

    if (category) {
      const cat = allCategories.find((c) => c.slug === category);
      if (cat) {
        conditions.push(eq(products.categoryId, cat.categoryId));
      }
    }

    const results = await db
      .select({
        productId: products.productId,
        productName: products.productName,
        slug: products.slug,
        basePrice: products.basePrice,
        mrp: products.mrp,
        label: products.label,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(40);

    // Get primary images
    const productIds = results.map((p) => p.productId);
    const imagesMap: Record<number, string> = {};

    if (productIds.length > 0) {
      const images = await db
        .select({
          productId: productVariants.productId,
          imagePath: productImages.imagePath,
        })
        .from(productImages)
        .innerJoin(
          productVariants,
          eq(productImages.variantId, productVariants.variantId)
        )
        .where(
          and(
            sql`${productVariants.productId} IN (${sql.join(
              productIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            eq(productImages.isPrimary, true)
          )
        );

      images.forEach((img) => {
        if (!imagesMap[img.productId]) {
          imagesMap[img.productId] = img.imagePath;
        }
      });
    }

    productList = results.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      slug: p.slug,
      basePrice: parseFloat(p.basePrice),
      mrp: parseFloat(p.mrp),
      label: p.label,
      image: imagesMap[p.productId] || "",
    }));
  }

  // Fetch recommendations when no query or no results
  const needsRecs = !q.trim() || productList.length === 0;
  const [trendingProducts, popularProducts] = needsRecs
    ? await Promise.all([getTrendingProducts(10), getPopularProducts(10)])
    : [[], []];

  // Deduplicate popular against trending
  const trendingIds = new Set(trendingProducts.map((p) => p.productId));
  const dedupedPopular = popularProducts.filter((p) => !trendingIds.has(p.productId));

  return (
    <main className="container mx-auto px-4 py-8">
      <SearchContent
        initialQuery={q}
        initialCategory={category || ""}
        categories={allCategories}
        products={productList}
        trendingProducts={trendingProducts}
        popularProducts={dedupedPopular}
      />
    </main>
  );
}
