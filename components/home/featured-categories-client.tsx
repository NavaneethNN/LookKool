"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";

interface Category {
  categoryId: number;
  categoryName: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

interface FeaturedCategoriesClientProps {
  categories: Category[];
}

export function FeaturedCategoriesClient({
  categories: dbCategories,
}: FeaturedCategoriesClientProps) {
  return (
    <section className="container mx-auto px-4 py-16 sm:py-24">
      <FadeIn direction="up" className="mb-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl tracking-tight">
              Shop by Category
            </h2>
            <p className="mt-2 text-muted-foreground text-base">
              Find exactly what you are looking for
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all duration-300"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </FadeIn>

      {dbCategories.length > 0 ? (
        <StaggerChildren
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          staggerDelay={0.1}
        >
          {dbCategories.map((cat) => (
            <StaggerItem key={cat.categoryId}>
              <Link
                href={`/categories/${cat.slug}`}
                className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.03] via-background to-accent/30 p-6 sm:p-8 text-center transition-all duration-500 card-glow hover:-translate-y-2 hover:border-primary/20"
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {cat.imageUrl ? (
                  <div className="relative mb-5 h-16 w-16 overflow-hidden rounded-2xl bg-background shadow-md ring-1 ring-border/50 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:scale-110">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.categoryName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-md ring-1 ring-primary/10 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-primary/15 group-hover:scale-110">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                )}

                <h3 className="relative font-semibold text-base transition-colors duration-300 group-hover:text-primary">
                  {cat.categoryName}
                </h3>

                {cat.description && (
                  <p className="relative mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2 max-w-[180px]">
                    {cat.description}
                  </p>
                )}

                <div className="relative mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  Browse Collection
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      ) : (
        <FadeIn>
          <div className="text-center py-12 text-muted-foreground">
            <p>Categories coming soon</p>
          </div>
        </FadeIn>
      )}
    </section>
  );
}
