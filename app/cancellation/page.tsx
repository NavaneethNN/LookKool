import { Metadata } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Cancellation Policy – ${siteConfig.businessName}`,
    description: `Cancellation policy for ${siteConfig.businessName}.`,
  };
}

export default async function CancellationPage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Cancellation Policy</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2>Order Cancellation</h2>
          <p>
            You may cancel your order from {siteConfig.businessName} before it has been
            shipped. Once an order is dispatched, it cannot be cancelled — you may
            instead request a return after delivery.
          </p>
        </section>

        <section>
          <h2>How to Cancel</h2>
          <ol>
            <li>
              Sign in to your account and go to{" "}
              <a href="/account/orders" className="text-primary hover:underline">
                My Orders
              </a>.
            </li>
            <li>
              Find the order you wish to cancel and click &quot;Cancel Order&quot; (available
              only if the order has not been shipped).
            </li>
            <li>
              Alternatively,{" "}
              <a href="/contact" className="text-primary hover:underline">
                contact us
              </a>{" "}
              with your order number and we&apos;ll assist you.
            </li>
          </ol>
        </section>

        <section>
          <h2>Refund on Cancellation</h2>
          <p>
            If your order was prepaid, the full amount will be refunded to your original
            payment method within 5–7 business days after the cancellation is confirmed.
          </p>
          <p>
            For Cash on Delivery orders, no charge will be collected if the order is
            cancelled before dispatch.
          </p>
        </section>

        <section>
          <h2>Cancellation by {siteConfig.businessName}</h2>
          <p>
            In rare cases, we may cancel an order due to stock unavailability, pricing
            errors, or suspected fraudulent activity. You will be notified immediately
            and any payment will be refunded in full.
          </p>
        </section>

        <section>
          <h2>Questions?</h2>
          <p>
            For any cancellation-related queries, please{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
