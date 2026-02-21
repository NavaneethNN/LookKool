import { Metadata } from "next";
import { CartContent } from "./cart-content";
import dynamic from "next/dynamic";
import { getCachedDeliveryConfig } from "@/lib/cached-data";
import { getPublicSiteConfig } from "@/lib/site-config";

const CartRecommendations = dynamic(
  () =>
    import("@/components/product/cart-recommendations").then(
      (mod) => mod.CartRecommendations
    ),
  { ssr: false }
);

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Shopping Cart – ${siteConfig.businessName}`,
    description: "Review your cart and proceed to checkout.",
  };
}

export default async function CartPage() {
  const deliveryConfig = await getCachedDeliveryConfig();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl mb-8">Shopping Cart</h1>
      <CartContent deliveryConfig={deliveryConfig} />
      <CartRecommendations />
    </main>
  );
}
