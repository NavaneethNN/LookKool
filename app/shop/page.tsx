import { Metadata } from "next";
import { db } from "@/db";
import {
  products,
  productVariants,
  productImages,
  categories,
} from "@/db/schema";
import { eq, and, asc, desc, sql, ilike, or } from "drizzle-orm";
import { getPublicSiteConfig } from "@/lib/site-config";
import { getCachedTrending, getCachedCategoryList } from "@/lib/cached-data";
import { ShopContent } from "./shop-content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Shop All – ${siteConfig.businessName}`,
    description: `Browse all products at ${siteConfig.businessName}. Find your perfect style.`,
  };
}

interface PageProps {
  searchParams: Promise<{
    sort?: string;
    page?: string;
    category?: string;
    q?: string;
  }>;
}

export default async function ShopAllPage({ searchParams }: PageProps) {
  const {
    sort = "newest",
    page = "1",
    category,
    q,
  } = await searchParams;

  // ── Fetch active categories for filter chips ─────────────────
  const allCategories = await getCachedCategoryList();

  // ── Build where conditions ───────────────────────────────────
  const conditions: ReturnType<typeof eq>[] = [eq(products.isActive, true)];

  // Category filter
  if (category) {
    const cat = allCategories.find((c) => c.slug === category);
    if (cat) {
      // Include subcategories
      const subcats = await db.query.categories.findMany({
        where: eq(categories.parentCategoryId, cat.categoryId),
      });
      const catIds = [cat.categoryId, ...subcats.map((c) => c.categoryId)];
      conditions.push(
        sql`${products.categoryId} IN (${sql.join(
          catIds.map((id) => sql`${id}`),
          sql`, `
        )})` as ReturnType<typeof eq>
      );
    }
  }

  // Search filter
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(products.productName, term),
        ilike(products.description, term),
        ilike(products.productCode, term)
      ) as ReturnType<typeof eq>
    );
  }

  // ── Sort order ───────────────────────────────────────────────
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

  // ── Paginated query ──────────────────────────────────────────
  const pageSize = 24;
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
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  // ── Primary images ───────────────────────────────────────────
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

  // ── Total count ──────────────────────────────────────────────
  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...conditions));

  const totalPages = Math.ceil(totalCount / pageSize);

  // ── Shape data ───────────────────────────────────────────────
  const items = productList.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    slug: p.slug,
    basePrice: parseFloat(p.basePrice),
    mrp: parseFloat(p.mrp),
    label: p.label,
    image: imagesMap[p.productId] || "",
  }));

  // ── Trending (shown when few results) ────────────────────────
  const trending =
    items.length < 4 ? await getCachedTrending(10) : [];

  const siteConfig = await getPublicSiteConfig();

  return (
    <main className="container mx-auto px-4 py-8">
      <ShopContent
        products={items}
        categories={allCategories}
        currentSort={sort}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        currentCategory={category || ""}
        currentQuery={q || ""}
        trendingProducts={trending}
        storeName={siteConfig.businessName}
      />
    </main>
  );
}
