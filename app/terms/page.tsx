import { Metadata } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Terms of Service – ${siteConfig.businessName}`,
    description: `Terms of service for ${siteConfig.businessName}.`,
  };
}

export default async function TermsPage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Terms of Service</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <p>
          <strong>Effective Date:</strong> January 1, 2025
        </p>

        <section>
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing and using {siteConfig.businessName} (&quot;the Website&quot;), you
            agree to be bound by these Terms of Service. If you do not agree, please do
            not use the Website.
          </p>
        </section>

        <section>
          <h2>Use of the Website</h2>
          <ul>
            <li>You must be at least 18 years old to make purchases.</li>
            <li>You agree to provide accurate information when creating an account and placing orders.</li>
            <li>You are responsible for maintaining the security of your account.</li>
          </ul>
        </section>

        <section>
          <h2>Products &amp; Pricing</h2>
          <p>
            We strive to display accurate product descriptions and pricing. However, we
            reserve the right to correct any errors and to change or update information
            at any time without prior notice.
          </p>
          <p>
            All prices are listed in Indian Rupees (INR) and are inclusive of applicable
            taxes unless stated otherwise.
          </p>
        </section>

        <section>
          <h2>Orders &amp; Payment</h2>
          <p>
            Placing an order constitutes an offer to purchase. We reserve the right to
            accept or decline any order. Payment is processed securely via Razorpay.
          </p>
        </section>

        <section>
          <h2>Shipping &amp; Delivery</h2>
          <p>
            Delivery timelines are estimates and may vary based on location and
            availability. See our{" "}
            <a href="/shipping" className="text-primary hover:underline">
              Shipping Information
            </a>{" "}
            page for details.
          </p>
        </section>

        <section>
          <h2>Returns &amp; Cancellations</h2>
          <p>
            Please refer to our{" "}
            <a href="/returns" className="text-primary hover:underline">
              Returns &amp; Refunds
            </a>{" "}
            and{" "}
            <a href="/cancellation" className="text-primary hover:underline">
              Cancellation Policy
            </a>{" "}
            pages.
          </p>
        </section>

        <section>
          <h2>Intellectual Property</h2>
          <p>
            All content on this Website — including text, images, logos, and design — is
            the property of {siteConfig.businessName} and is protected by intellectual
            property laws.
          </p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>
            {siteConfig.businessName} shall not be liable for any indirect, incidental, or
            consequential damages arising from the use of this Website or products
            purchased through it.
          </p>
        </section>

        <section>
          <h2>Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the Website
            after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For questions about these terms, please{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
