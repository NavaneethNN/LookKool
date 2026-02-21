import { Metadata } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Returns & Refunds – ${siteConfig.businessName}`,
    description: `Returns and refund policy for ${siteConfig.businessName}.`,
  };
}

export default async function ReturnsPage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Returns &amp; Refunds</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2>Return Policy</h2>
          <p>
            At {siteConfig.businessName}, we want you to be completely satisfied with your
            purchase. If you&apos;re not happy with your order, you may request a return within
            7 days of delivery.
          </p>
        </section>

        <section>
          <h2>Eligibility</h2>
          <ul>
            <li>Items must be unworn, unwashed, and in original condition with tags intact.</li>
            <li>Items must be returned in the original packaging.</li>
            <li>Sale items and innerwear may not be eligible for returns.</li>
          </ul>
        </section>

        <section>
          <h2>How to Initiate a Return</h2>
          <ol>
            <li>
              Go to{" "}
              <a href="/account/orders" className="text-primary hover:underline">
                My Orders
              </a>{" "}
              and select the order you wish to return.
            </li>
            <li>Click &quot;Request Return&quot; and provide the reason.</li>
            <li>Our team will review your request and arrange pickup if approved.</li>
          </ol>
        </section>

        <section>
          <h2>Refund Process</h2>
          <p>
            Once we receive and inspect the returned item, your refund will be processed
            within 5–7 business days. The refund will be credited to your original payment method.
          </p>
        </section>

        <section>
          <h2>Exchanges</h2>
          <p>
            If you received a defective or wrong item, we&apos;ll arrange a free exchange.
            Please{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us
            </a>{" "}
            within 48 hours of delivery with photos of the issue.
          </p>
        </section>
      </div>
    </main>
  );
}
