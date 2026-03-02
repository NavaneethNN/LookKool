"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "@/components/ui/motion";
import type { PublicSiteConfig } from "@/lib/site-config-shared";

interface HeroSectionProps {
  siteConfig: PublicSiteConfig;
}

export function HeroSection({ siteConfig }: HeroSectionProps) {
  const badgeText = siteConfig.heroBadgeText || "New Collection 2026";
  const title =
    siteConfig.heroTitle || `Welcome to ${siteConfig.businessName}`;
  const subtitle =
    siteConfig.heroSubtitle ||
    siteConfig.siteDescription ||
    "Your go-to boutique for trendy, affordable fashion. From kurtas to dresses, find your perfect look.";
  const ctaText = siteConfig.heroCtaText || "Shop Now";
  const ctaLink = siteConfig.heroCtaLink || "/categories/women";
  const secondaryCtaText =
    siteConfig.heroSecondaryCtaText || "New Arrivals";
  const secondaryCtaLink =
    siteConfig.heroSecondaryCtaLink || "/new-arrivals";

  return (
    <section className="relative isolate overflow-hidden min-h-[85vh] flex items-center">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,hsl(299_60%_85%/0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_10%_60%,hsl(330_60%_90%/0.1),transparent)]" />
      </div>

      {/* Animated decorative orbs */}
      <div className="absolute -top-20 -right-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/[0.07] to-purple-300/[0.05] blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-pink-200/[0.08] to-primary/[0.04] blur-3xl animate-float-reverse" />
      <div className="absolute top-1/4 right-1/4 h-[200px] w-[200px] rounded-full bg-primary/[0.04] blur-2xl animate-float" />

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-[15%] left-[8%] h-16 w-16 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent rotate-12"
        animate={{ y: [-8, 8, -8], rotate: [12, 18, 12] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[20%] right-[12%] h-12 w-12 rounded-full border border-primary/10 bg-gradient-to-br from-accent to-transparent"
        animate={{ y: [10, -10, 10], x: [-5, 5, -5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[25%] left-[15%] h-8 w-8 rounded-lg border border-primary/10 bg-primary/5 rotate-45"
        animate={{ y: [-12, 12, -12], rotate: [45, 55, 45] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[8%] h-20 w-20 rounded-3xl border border-primary/[0.06] bg-gradient-to-tl from-primary/[0.03] to-transparent -rotate-6"
        animate={{ y: [6, -14, 6], rotate: [-6, -12, -6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-6 animate-border-glow">
              <Sparkles className="h-3.5 w-3.5" />
              {badgeText}
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl gradient-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button
              size="lg"
              className="group h-12 px-8 text-base shadow-lg shadow-primary/25 animate-pulse-glow transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              asChild
            >
              <Link href={ctaLink}>
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="group h-12 px-8 text-base transition-all duration-300 hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.02]"
              asChild
            >
              <Link href={secondaryCtaLink}>
                {secondaryCtaText}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-14 flex items-center justify-center gap-6 text-xs text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Free Shipping
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Easy Returns
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Secure Checkout
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
