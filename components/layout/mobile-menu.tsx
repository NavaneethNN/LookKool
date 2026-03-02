"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, Heart, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { NavLinkConfig } from "@/lib/site-config";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logoSrc: string;
  siteName: string;
  navLinks: NavLinkConfig[];
  shopAllLink: { label: string; href: string };
  pathname: string;
  user: { id: string; email?: string } | null;
}

export function MobileMenu({
  open,
  onOpenChange,
  logoSrc,
  siteName,
  navLinks,
  shopAllLink,
  pathname,
  user,
}: MobileMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu" className="h-9 w-9">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
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
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Links */}
          <nav className="flex flex-col gap-0.5 px-3 py-4">
            {[...navLinks, shopAllLink].map((link, i) => {
              const href = "href" in link ? link.href : "";
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "hover:bg-accent/80"
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {link.label}
                  <ArrowRight
                    className={cn(
                      "h-3.5 w-3.5 transition-all duration-300",
                      isActive
                        ? "opacity-100"
                        : "opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Mobile Footer Actions */}
          <div className="mt-auto border-t px-4 py-5 space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl h-10"
                asChild
              >
                <Link href="/search" onClick={() => onOpenChange(false)}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl h-10"
                asChild
              >
                <Link href="/wishlist" onClick={() => onOpenChange(false)}>
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Link>
              </Button>
            </div>
            {user ? (
              <Button
                className="w-full rounded-xl h-10 shadow-sm shadow-primary/20"
                size="sm"
                asChild
              >
                <Link href="/account" onClick={() => onOpenChange(false)}>
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </Link>
              </Button>
            ) : (
              <Button
                className="w-full rounded-xl h-10 shadow-sm shadow-primary/20"
                size="sm"
                asChild
              >
                <Link href="/sign-in" onClick={() => onOpenChange(false)}>
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
