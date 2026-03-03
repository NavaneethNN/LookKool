import { Metadata } from "next";
import { WishlistContent } from "./wishlist-content";
import dynamic from "next/dynamic";
import { getPublicSiteConfig } from "@/lib/site-config";

const WishlistRecommendations = dynamic(
  () =>
    import("@/components/product/wishlist-recommendations").then(
      (mod) => mod.WishlistRecommendations
    )
);

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Wishlist – ${siteConfig.businessName}`,
    description: `Your saved products on ${siteConfig.businessName}.`,
  };
}

export default function WishlistPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl mb-8">My Wishlist</h1>
      <WishlistContent />
      <WishlistRecommendations />
    </main>
  );
}
