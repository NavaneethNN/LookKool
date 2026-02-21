import { Metadata } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `Privacy Policy – ${siteConfig.businessName}`,
    description: `Privacy policy for ${siteConfig.businessName}.`,
  };
}

export default async function PrivacyPage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Privacy Policy</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <p>
          <strong>Effective Date:</strong> January 1, 2025
        </p>

        <section>
          <h2>Information We Collect</h2>
          <p>
            When you use {siteConfig.businessName}, we may collect the following
            information:
          </p>
          <ul>
            <li>
              <strong>Account Information:</strong> Name, email address, and profile
              details provided via Google sign-in.
            </li>
            <li>
              <strong>Order Information:</strong> Shipping address, phone number, and
              payment details (processed securely via Razorpay).
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited, products viewed, and
              interaction patterns to improve your experience.
            </li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>To process and deliver your orders</li>
            <li>To send order confirmations and shipping updates</li>
            <li>To provide customer support</li>
            <li>To personalize your shopping experience</li>
            <li>To send promotional emails (with your consent)</li>
          </ul>
        </section>

        <section>
          <h2>Data Security</h2>
          <p>
            We use industry-standard security measures to protect your data. Payment
            information is processed by Razorpay and is never stored on our servers.
            Your account is secured via Supabase authentication.
          </p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>Razorpay</strong> — payment processing</li>
            <li><strong>Google</strong> — authentication (sign-in)</li>
            <li><strong>Shipping partners</strong> — order delivery</li>
          </ul>
          <p>
            These services have their own privacy policies governing the use of your
            information.
          </p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and update your personal information via your account</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of promotional communications</li>
          </ul>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            For privacy-related queries, please{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
