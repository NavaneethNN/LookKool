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

export default async function HomePage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <>
      <HeroSection siteConfig={siteConfig} />
      <FeaturedCategories />
      <HomeRecommendations />
      <FeaturesStrip />
      <div className="container mx-auto px-4 py-8">
        <RecentlyViewedHome />
      </div>
      <NewsletterSection />
    </>
  );
}
