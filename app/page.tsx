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
    ),
  { ssr: false }
);

const RecentlyViewedHome = dynamic(
  () =>
    import("@/components/product/recently-viewed").then(
      (mod) => mod.RecentlyViewed
    ),
  { ssr: false }
);

// Revalidate the homepage every 60 seconds
export const revalidate = 60;

function SectionSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse">
      <div className="h-7 w-48 rounded-lg bg-muted mb-2" />
      <div className="h-4 w-64 rounded bg-muted/70 mb-6" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 overflow-hidden mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[200px] flex-shrink-0 rounded-2xl border border-border/40 bg-muted/20 p-4"
            >
              <div className="mb-3 aspect-[3/4] rounded-xl bg-muted/50" />
              <div className="mb-2 h-4 w-3/4 rounded bg-muted/50" />
              <div className="h-4 w-1/2 rounded bg-muted/50" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="container mx-auto px-4 py-16 animate-pulse">
      <div className="mb-12">
        <div className="h-9 w-56 rounded-lg bg-muted" />
        <div className="mt-2 h-5 w-72 rounded bg-muted/70" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-2xl border border-border/40 bg-muted/20 p-8"
          >
            <div className="mb-5 h-16 w-16 rounded-2xl bg-muted/50" />
            <div className="h-5 w-24 rounded bg-muted/50" />
            <div className="mt-2 h-3 w-32 rounded bg-muted/30" />
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

      <div className="container mx-auto px-4 py-10">
        <RecentlyViewedHome />
      </div>

      <NewsletterSection />
    </>
  );
}
