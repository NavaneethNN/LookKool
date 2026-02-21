"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

/**
 * Conditionally hides the storefront Navbar + Footer on /studio/* routes.
 * This prevents the customer notification bell from polling on admin pages
 * and removes the redundant storefront chrome from the admin dashboard.
 */
export function LayoutShell({
  navbar,
  footer,
  children,
}: {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  if (isStudio) {
    // Admin pages have their own sidebar layout — no storefront chrome
    return <>{children}</>;
  }

  return (
    <>
      {navbar}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
