import { Metadata } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();
  return {
    title: `FAQ – ${siteConfig.businessName}`,
    description: `Frequently asked questions about ${siteConfig.businessName}.`,
  };
}

const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse our shop, add items to your cart, and proceed to checkout. You can pay online via Razorpay (UPI, cards, net banking) or choose Cash on Delivery where available.",
  },
  {
    q: "How can I track my order?",
    a: 'Sign in to your account and visit "My Orders" to see the latest status and tracking details for your order.',
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, credit/debit cards, net banking, and wallets via Razorpay. Cash on Delivery is available for select locations.",
  },
  {
    q: "Can I cancel my order?",
    a: 'You can request cancellation before the order is shipped. Visit "My Orders" or contact us for assistance. See our Cancellation Policy for details.',
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 7 days of delivery for items in original condition. Visit our Returns & Refunds page for full details.",
  },
  {
    q: "How long does delivery take?",
    a: "Metro cities: 3–5 business days. Other locations: 5–10 business days. Check our Shipping Information page for details.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Free shipping may be available on orders above a certain amount. Check our current promotions at checkout for details.",
  },
  {
    q: "How do I create an account?",
    a: 'Click "Sign In" and use your Google account to sign up instantly. No separate registration is needed.',
  },
];

export default async function FaqPage() {
  const siteConfig = await getPublicSiteConfig();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-muted-foreground mb-10">
        Find answers to common questions about {siteConfig.businessName}.
      </p>

      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold text-lg mb-2">{faq.q}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center text-sm text-muted-foreground">
        <p>
          Still have questions?{" "}
          <a href="/contact" className="text-primary hover:underline">
            Contact us
          </a>{" "}
          and we&apos;ll be happy to help.
        </p>
      </div>
    </main>
  );
}
