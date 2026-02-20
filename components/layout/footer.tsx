import Link from "next/link";
import Image from "next/image";
import { Heart, Phone, Mail } from "lucide-react";
import type { PublicSiteConfig } from "@/lib/site-config";
import {
  DEFAULT_QUICK_LINKS,
  DEFAULT_HELP_LINKS,
  DEFAULT_LEGAL_LINKS,
} from "@/lib/site-config";

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

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Image
              src={logoSrc}
              alt={siteName}
              width={120}
              height={40}
              className="h-9 w-auto"
            />
            <p className="text-sm text-muted-foreground max-w-[250px]">
              {description}
            </p>
            {(siteConfig.footerContactPhone || siteConfig.footerContactEmail) && (
              <div className="space-y-1.5">
                {siteConfig.footerContactPhone && (
                  <a
                    href={`tel:${siteConfig.footerContactPhone}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {siteConfig.footerContactPhone}
                  </a>
                )}
                {siteConfig.footerContactEmail && (
                  <a
                    href={`mailto:${siteConfig.footerContactEmail}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {siteConfig.footerContactEmail}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Help */}
          {helpLinks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Help</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {helpLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legal */}
          {legalLinks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          {siteConfig.footerShowMadeInIndia && (
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              Made in India with{" "}
              <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
