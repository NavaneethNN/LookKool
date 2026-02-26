"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { UserActions } from "@/components/layout/user-actions";
import type { PublicSiteConfig } from "@/lib/site-config";

interface NavbarProps {
  siteConfig: PublicSiteConfig;
}

export function Navbar({ siteConfig }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cartCount = useCartStore((s) => s.itemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  useEffect(() => setMounted(true), []);

  const logoSrc = siteConfig.siteLogoUrl || "/NewLogo.png";
  const siteName = siteConfig.businessName;
  const navLinks = siteConfig.navLinksConfig.filter((l) => l.enabled && l.href !== "/shop");

  // Static "Shop All" link — always present
  const shopAllLink = { label: "Shop All", href: "/shop" };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoSrc}
            alt={siteName}
            width={120}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={shopAllLink.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === shopAllLink.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {shopAllLink.label}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <UserActions
          mounted={mounted}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          user={user}
        />

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </Button>
          <MobileMenu
            open={open}
            onOpenChange={setOpen}
            logoSrc={logoSrc}
            siteName={siteName}
            navLinks={navLinks}
            shopAllLink={shopAllLink}
            pathname={pathname}
            user={user}
          />
        </div>
      </div>
    </header>
  );
}
