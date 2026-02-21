import { Metadata } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Shipping Information – ${siteConfig.businessName}`,
    description: `Shipping policy and delivery details for ${siteConfig.businessName}.`,
  };
}

export default async function ShippingPage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shipping Information</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2>Delivery Across India</h2>
          <p>
            {siteConfig.businessName} delivers to all major cities and towns across India.
            We partner with trusted logistics providers to ensure your order reaches you safely.
          </p>
        </section>

        <section>
          <h2>Processing Time</h2>
          <p>
            Orders are processed within 1–2 business days. You will receive a confirmation
            email with tracking details once your order has been dispatched.
          </p>
        </section>

        <section>
          <h2>Estimated Delivery Time</h2>
          <ul>
            <li><strong>Metro cities:</strong> 3–5 business days</li>
            <li><strong>Tier 2 &amp; 3 cities:</strong> 5–7 business days</li>
            <li><strong>Remote areas:</strong> 7–10 business days</li>
          </ul>
        </section>

        <section>
          <h2>Shipping Charges</h2>
          <p>
            Shipping charges, if applicable, are calculated at checkout based on your
            delivery location and order weight. Free shipping may be offered on orders
            above a certain amount — check our current promotions.
          </p>
        </section>

        <section>
          <h2>Order Tracking</h2>
          <p>
            Once shipped, you can track your order from the{" "}
            <a href="/account/orders" className="text-primary hover:underline">
              My Orders
            </a>{" "}
            section of your account.
          </p>
        </section>

        <section>
          <h2>Questions?</h2>
          <p>
            For any shipping-related queries, please{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
