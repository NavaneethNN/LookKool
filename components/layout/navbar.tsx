"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, Heart, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { CustomerNotificationBell } from "@/components/layout/customer-notification-bell";
import { useAuth } from "@/lib/hooks/use-auth";
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
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>
          </Button>
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
          {mounted && user ? (
            <>
              <CustomerNotificationBell />
              <Button variant="ghost" size="icon" asChild>
                <Link href="/account" aria-label="Account">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            </>
          ) : mounted ? (
            <Button asChild size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          ) : (
            <div className="w-[70px]" />
          )}
        </div>

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
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between border-b px-4 py-4">
                  <Image
                    src={logoSrc}
                    alt={siteName}
                    width={100}
                    height={34}
                    className="h-8 w-auto"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mobile Links */}
                <nav className="flex flex-col gap-1 px-3 py-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname === link.href
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href={shopAllLink.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === shopAllLink.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                  >
                    {shopAllLink.label}
                  </Link>
                </nav>

                {/* Mobile Footer Actions */}
                <div className="mt-auto border-t px-4 py-4 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href="/search"
                        onClick={() => setOpen(false)}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href="/wishlist"
                        onClick={() => setOpen(false)}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Wishlist
                      </Link>
                    </Button>
                  </div>
                  {user ? (
                    <Button
                      className="w-full"
                      size="sm"
                      asChild
                    >
                      <Link
                        href="/account"
                        onClick={() => setOpen(false)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        My Account
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      size="sm"
                      asChild
                    >
                      <Link
                        href="/sign-in"
                        onClick={() => setOpen(false)}
                      >
                        Sign In
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}