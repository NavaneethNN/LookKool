import type { Metadata } from "next";
import { CheckoutContent } from "./checkout-content";
import { getPublicSiteConfig } from "@/lib/site-config";
import { getPublicDeliveryConfig } from "@/lib/actions/checkout-actions";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const [siteConfig, deliveryConfig] = await Promise.all([
    getPublicSiteConfig(),
    getPublicDeliveryConfig(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      <h1 className="text-2xl font-bold sm:text-3xl mb-8">Checkout</h1>
      <CheckoutContent
        storeName={siteConfig.businessName}
        brandColor={siteConfig.sitePrimaryColor}
        deliveryConfig={deliveryConfig}
      />
    </div>
  );
}
