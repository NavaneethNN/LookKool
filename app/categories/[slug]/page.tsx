import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories, products, productVariants, productImages } from "@/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { ProductGrid } from "./product-grid";
import { SlidersHorizontal } from "lucide-react";
import { getPopularInCategory, getTrendingProducts } from "@/lib/actions/recommendation-actions";
import { ProductRecommendationStrip } from "@/components/product/recommendation-strip";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { TrendingUp, Star } from "lucide-react";
import { getPublicSiteConfig } from "@/lib/site-config";

// Revalidate category pages every 60 seconds
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [category, siteConfig] = await Promise.all([
    db.query.categories.findFirst({ where: eq(categories.slug, slug) }),
    getPublicSiteConfig(),
  ]);
  if (!category) return { title: "Category Not Found" };
  const storeName = siteConfig.businessName;
  return {
    title: `${category.categoryName} – ${storeName}`,
    description: category.description || `Shop ${category.categoryName} at ${storeName}`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sort = "newest", page = "1" } = await searchParams;

  // Fetch category
  const category = await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.isActive, true)),
  });

  if (!category) notFound();

  // Fetch subcategories (to include products from child categories too)
  const subcats = await db.query.categories.findMany({
    where: eq(categories.parentCategoryId, category.categoryId),
  });
  const categoryIds = [category.categoryId, ...subcats.map((c: typeof categories.$inferSelect) => c.categoryId)];

  // Determine sort order
  let orderBy;
  switch (sort) {
    case "price-asc":
      orderBy = asc(products.basePrice);
      break;
    case "price-desc":
      orderBy = desc(products.basePrice);
      break;
    case "popular":
      orderBy = asc(products.priority);
      break;
    default:
      orderBy = desc(products.createdAt);
  }

  // Fetch products with first image
  const pageSize = 20;
  const currentPage = Math.max(1, parseInt(page));
  const offset = (currentPage - 1) * pageSize;

  const productList = await db
    .select({
      productId: products.productId,
      productName: products.productName,
      slug: products.slug,
      basePrice: products.basePrice,
      mrp: products.mrp,
      label: products.label,
    })
    .from(products)
    .where(
      and(
        sql`${products.categoryId} IN (${sql.join(
          categoryIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(products.isActive, true)
      )
    )
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  // Get primary images for these products
  const productIds = productList.map((p) => p.productId);
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

  // Get total count for pagination
  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(
      and(
        sql`${products.categoryId} IN (${sql.join(
          categoryIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        eq(products.isActive, true)
      )
    );

  const totalPages = Math.ceil(totalCount / pageSize);

  // Shape data for client
  const items = productList.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    slug: p.slug,
    basePrice: parseFloat(p.basePrice),
    mrp: parseFloat(p.mrp),
    label: p.label,
    image: imagesMap[p.productId] || "",
  }));

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{category.categoryName}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "product" : "products"} found
        </p>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sort:</span>
          <SortLinks currentSort={sort} slug={slug} />
        </div>
      </div>

      {/* Product Grid */}
      <ProductGrid products={items} />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          slug={slug}
          sort={sort}
        />
      )}

      {/* Recommendations */}
      <CategoryRecommendations
        categoryId={category.categoryId}
        productIds={productIds}
      />
    </main>
  );
}

function SortLinks({
  currentSort,
  slug,
}: {
  currentSort: string;
  slug: string;
}) {
  const options = [
    { value: "newest", label: "Newest" },
    { value: "popular", label: "Popular" },
    { value: "price-asc", label: "Price: Low" },
    { value: "price-desc", label: "Price: High" },
  ];

  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <a
          key={opt.value}
          href={`/categories/${slug}?sort=${opt.value}`}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            currentSort === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {opt.label}
        </a>
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  slug,
  sort,
}: {
  currentPage: number;
  totalPages: number;
  slug: string;
  sort: string;
}) {
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <a
          href={`/categories/${slug}?sort=${sort}&page=${currentPage - 1}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Previous
        </a>
      )}
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <a
          href={`/categories/${slug}?sort=${sort}&page=${currentPage + 1}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Next
        </a>
      )}
    </div>
  );
}

async function CategoryRecommendations({
  categoryId,
  productIds,
}: {
  categoryId: number;
  productIds: number[];
}) {
  const [popularInCat, trending] = await Promise.all([
    getPopularInCategory(categoryId, productIds, 10),
    getTrendingProducts(10),
  ]);

  // Deduplicate trending against already-shown products and popular-in-category
  const shownIds = new Set([
    ...productIds,
    ...popularInCat.map((p) => p.productId),
  ]);
  const filteredTrending = trending.filter((p) => !shownIds.has(p.productId));

  const hasRecs = popularInCat.length > 0 || filteredTrending.length > 0;
  if (!hasRecs) return null;

  return (
    <div className="mt-12 space-y-2">
      <ProductRecommendationStrip
        title="More From This Category"
        icon={<Star className="h-5 w-5" />}
        subtitle="Explore similar styles"
        products={popularInCat}
        layout="scroll"
        variant="muted"
      />
      <ProductRecommendationStrip
        title="Trending Across Store"
        icon={<TrendingUp className="h-5 w-5" />}
        products={filteredTrending}
        layout="scroll"
        variant="accent"
      />
      <RecentlyViewed excludeIds={productIds} />
    </div>
  );
}
