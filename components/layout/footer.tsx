"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  ArrowUpRight,
} from "lucide-react";
import { FadeIn } from "@/components/ui/motion";
import type { PublicSiteConfig } from "@/lib/site-config-shared";
import {
  DEFAULT_QUICK_LINKS,
  DEFAULT_HELP_LINKS,
  DEFAULT_LEGAL_LINKS,
} from "@/lib/site-config-shared";

interface FooterProps {
  siteConfig: PublicSiteConfig;
}

export function Footer({ siteConfig }: FooterProps) {
  const logoSrc = siteConfig.siteLogoUrl || "/NewLogo.png";
  const siteName = siteConfig.businessName;
  const description =
    siteConfig.footerTagline ||
    siteConfig.siteDescription ||
    "Your go-to boutique for trendy, affordable fashion. Quality clothing delivered to your door.";

  const quickLinks = siteConfig.footerQuickLinks ?? DEFAULT_QUICK_LINKS;
  const helpLinks = siteConfig.footerHelpLinks ?? DEFAULT_HELP_LINKS;
  const legalLinks = siteConfig.footerLegalLinks ?? DEFAULT_LEGAL_LINKS;

  const socialLinks = [
    { url: siteConfig.socialInstagram, icon: Instagram, label: "Instagram" },
    { url: siteConfig.socialFacebook, icon: Facebook, label: "Facebook" },
    { url: siteConfig.socialTwitter, icon: Twitter, label: "Twitter" },
    { url: siteConfig.socialYoutube, icon: Youtube, label: "YouTube" },
  ].filter((s) => s.url);

  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <FadeIn direction="up">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-5">
              <Image
                src={logoSrc}
                alt={siteName}
                width={120}
                height={40}
                className="h-9 w-auto"
              />
              <p className="text-sm text-muted-foreground max-w-[250px] leading-relaxed">
                {description}
              </p>
              {(siteConfig.footerContactPhone ||
                siteConfig.footerContactEmail) && (
                <div className="space-y-2">
                  {siteConfig.footerContactPhone && (
                    <a
                      href={`tel:${siteConfig.footerContactPhone}`}
                      className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      {siteConfig.footerContactPhone}
                    </a>
                  )}
                  {siteConfig.footerContactEmail && (
                    <a
                      href={`mailto:${siteConfig.footerContactEmail}`}
                      className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      {siteConfig.footerContactEmail}
                    </a>
                  )}
                </div>
              )}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-sm"
                      aria-label={social.label}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            {quickLinks.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Quick Links</h4>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {quickLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 hover:text-primary transition-all duration-300"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Help */}
            {helpLinks.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Help</h4>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {helpLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 hover:text-primary transition-all duration-300"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legal */}
            {legalLinks.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Legal</h4>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 hover:text-primary transition-all duration-300"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </FadeIn>

        <div className="mt-12 flex flex-col items-center gap-3 border-t pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          {siteConfig.footerShowMadeInIndia && (
            <p className="text-xs text-muted-foreground/70 inline-flex items-center gap-1">
              Made in India with{" "}
              <Heart className="h-3.5 w-3.5 fill-primary text-primary animate-pulse" />
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
