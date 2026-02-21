import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPublicSiteConfig } from "@/lib/site-config";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Collections – ${siteConfig.businessName}`,
    description: `Browse all collections at ${siteConfig.businessName}.`,
  };
}

export default async function CollectionsPage() {
  const [allCategories, siteConfig] = await Promise.all([
    db
      .select({
        categoryId: categories.categoryId,
        categoryName: categories.categoryName,
        slug: categories.slug,
        imageUrl: categories.imageUrl,
        description: categories.description,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder),
    getPublicSiteConfig(),
  ]);

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Collections</h1>
      <p className="text-muted-foreground mb-10">
        Browse all collections at {siteConfig.businessName}
      </p>

      {allCategories.length === 0 ? (
        <p className="text-muted-foreground">No collections available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCategories.map((cat) => (
            <Link
              key={cat.categoryId}
              href={`/categories/${cat.slug}`}
              className="group relative block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
            >
              {cat.imageUrl ? (
                <img
                  src={cat.imageUrl}
                  alt={cat.categoryName}
                  className="h-56 w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="h-56 w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  No Image
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg">{cat.categoryName}</h2>
                {cat.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
