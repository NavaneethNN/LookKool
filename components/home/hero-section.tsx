import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicSiteConfig } from "@/lib/site-config-shared";

interface HeroSectionProps {
  siteConfig: PublicSiteConfig;
}

export function HeroSection({ siteConfig }: HeroSectionProps) {
  const badgeText = siteConfig.heroBadgeText || "New Collection 2026";
  const title = siteConfig.heroTitle || `Welcome to ${siteConfig.businessName}`;
  const subtitle =
    siteConfig.heroSubtitle ||
    siteConfig.siteDescription ||
    "Your go-to boutique for trendy, affordable fashion. From kurtas to dresses, find your perfect look.";
  const ctaText = siteConfig.heroCtaText || "Shop Now";
  const ctaLink = siteConfig.heroCtaLink || "/categories/women";
  const secondaryCtaText = siteConfig.heroSecondaryCtaText || "New Arrivals";
  const secondaryCtaLink = siteConfig.heroSecondaryCtaLink || "/new-arrivals";

  return (
    <section className="relative isolate overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />

      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {badgeText}
          </div>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-12 px-8 text-base shadow-lg shadow-primary/25"
              asChild
            >
              <Link href={ctaLink}>
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base"
              asChild
            >
              <Link href={secondaryCtaLink}>
                {secondaryCtaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-300/10 blur-3xl" />
    </section>
  );
}
