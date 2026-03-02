"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingBag, User } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logoSrc = siteConfig.siteLogoUrl || "/NewLogo.png";
  const siteName = siteConfig.businessName;
  const navLinks = siteConfig.navLinksConfig.filter(
    (l) => l.enabled && l.href !== "/shop"
  );
  const shopAllLink = { label: "Shop All", href: "/shop" };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        scrolled
          ? "glass-strong border-b shadow-sm shadow-black/[0.03]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02]"
        >
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
        <nav className="hidden md:flex items-center gap-1">
          {[...navLinks, shopAllLink].map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors duration-300",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {/* Animated underline */}
                <span
                  className={cn(
                    "absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-primary transition-all duration-300 origin-left",
                    isActive
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0 group-hover:scale-x-100"
                  )}
                />
                {/* Hover underline */}
                {!isActive && (
                  <span className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-primary/50 scale-x-0 hover-underline transition-transform duration-300 origin-left" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <UserActions
          mounted={mounted}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          user={user}
        />

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative h-9 w-9"
          >
            <Link href="/cart" aria-label="Cart">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-badge-pop">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </Button>
          {mounted &&
            (user ? (
              <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                <Link href="/account" aria-label="Account">
                  <User className="h-[18px] w-[18px]" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                <Link href="/sign-in" aria-label="Sign In">
                  <User className="h-[18px] w-[18px]" />
                </Link>
              </Button>
            ))}
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
