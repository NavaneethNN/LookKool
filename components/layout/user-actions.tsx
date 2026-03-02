"use client";

import Link from "next/link";
import { ShoppingBag, Heart, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerNotificationBell } from "@/components/layout/customer-notification-bell";

interface UserActionsProps {
  mounted: boolean;
  cartCount: number;
  wishlistCount: number;
  user: { id: string; email?: string } | null;
}

export function UserActions({
  mounted,
  cartCount,
  wishlistCount,
  user,
}: UserActionsProps) {
  return (
    <div className="hidden md:flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="h-9 w-9 rounded-full hover:bg-accent transition-all duration-300 hover:scale-105"
      >
        <Link href="/search" aria-label="Search">
          <Search className="h-[18px] w-[18px]" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="relative h-9 w-9 rounded-full hover:bg-accent transition-all duration-300 hover:scale-105"
      >
        <Link href="/wishlist" aria-label="Wishlist">
          <Heart className="h-[18px] w-[18px]" />
          {mounted && wishlistCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-badge-pop">
              {wishlistCount > 9 ? "9+" : wishlistCount}
            </span>
          )}
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="relative h-9 w-9 rounded-full hover:bg-accent transition-all duration-300 hover:scale-105"
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
      {mounted && user ? (
        <>
          <CustomerNotificationBell />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-9 w-9 rounded-full hover:bg-accent transition-all duration-300 hover:scale-105"
          >
            <Link href="/account" aria-label="Account">
              <User className="h-[18px] w-[18px]" />
            </Link>
          </Button>
        </>
      ) : mounted ? (
        <Button
          asChild
          size="sm"
          className="ml-1 rounded-full px-5 shadow-sm shadow-primary/20 transition-all duration-300 hover:shadow-md hover:shadow-primary/25 hover:scale-[1.02]"
        >
          <Link href="/sign-in">Sign In</Link>
        </Button>
      ) : (
        <div className="w-[70px]" />
      )}
    </div>
  );
}
