import { Suspense } from "react";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { FeaturesStrip } from "@/components/home/features-strip";
import { HomeRecommendations } from "@/components/home/home-recommendations";
import { getPublicSiteConfig } from "@/lib/site-config";

const NewsletterSection = dynamic(
  () =>
    import("@/components/home/newsletter-section").then(
      (mod) => mod.NewsletterSection
    )
);

const RecentlyViewedHome = dynamic(
  () =>
    import("@/components/product/recently-viewed").then(
      (mod) => mod.RecentlyViewed
    )
);

// Revalidate the homepage every 60 seconds
export const revalidate = 60;

function SectionSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-7 w-40 rounded bg-muted mb-4" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 overflow-hidden mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[200px] flex-shrink-0 rounded-xl border bg-muted/30 p-4"
            >
              <div className="mb-3 aspect-square rounded-lg bg-muted" />
              <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="container mx-auto px-4 py-14 animate-pulse">
      <div className="mb-10">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="mt-2 h-5 w-64 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center rounded-2xl border bg-muted/30 p-8">
            <div className="mb-4 h-14 w-14 rounded-xl bg-muted" />
            <div className="h-5 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <>
      <HeroSection siteConfig={siteConfig} />
      <Suspense fallback={<CategorySkeleton />}>
        <FeaturedCategories />
      </Suspense>
      <Suspense fallback={<SectionSkeleton rows={3} />}>
        <HomeRecommendations />
      </Suspense>
      <FeaturesStrip />
      <div className="container mx-auto px-4 py-8">
        <RecentlyViewedHome />
      </div>
      <NewsletterSection />
    </>
  );
}
