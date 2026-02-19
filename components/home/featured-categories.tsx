import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function FeaturedCategories() {
  const dbCategories = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: categories.sortOrder,
    limit: 8,
  });

  return (
    <section className="container mx-auto px-4 py-14 sm:py-20">
      <div className="mb-10">
        <h2 className="text-2xl font-bold sm:text-3xl">Shop by Category</h2>
        <p className="mt-2 text-muted-foreground">
          Find exactly what you are looking for
        </p>
      </div>

      {dbCategories.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {dbCategories.map((cat: typeof categories.$inferSelect) => (
            <Link
              key={cat.categoryId}
              href={`/categories/${cat.slug}`}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 to-purple-100/30 p-6 sm:p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
            >
              {cat.imageUrl ? (
                <div className="mb-4 relative h-14 w-14 overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.categoryName}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              )}
              <h3 className="font-semibold text-base">{cat.categoryName}</h3>
              {cat.description && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Browse
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Categories coming soon</p>
        </div>
      )}
    </section>
  );
}
