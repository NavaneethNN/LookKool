import dynamic from "next/dynamic";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { FeaturesStrip } from "@/components/home/features-strip";
import { HomeRecommendations } from "@/components/home/home-recommendations";

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

export default function HomePage() {
  return (
    <>
      <HeroSection />
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
