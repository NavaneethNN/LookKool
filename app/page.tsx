import dynamic from "next/dynamic";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { FeaturesStrip } from "@/components/home/features-strip";

const NewsletterSection = dynamic(
  () =>
    import("@/components/home/newsletter-section").then(
      (mod) => mod.NewsletterSection
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
      <FeaturesStrip />
      <NewsletterSection />
    </>
  );
}
