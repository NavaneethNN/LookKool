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
  );
}
