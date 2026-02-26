import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware
 * Cookie-only check (Edge-safe — no DB calls, no postgres driver).
 * 1. Checks for Better Auth session cookie
 * 2. Protects /account/*, /checkout, /studio — redirects to /sign-in if no cookie
 * 3. Redirects signed-in users away from /sign-in, /sign-up
 *
 * Role-based studio access is enforced in app/studio/layout.tsx via requireAdminOrCashier().
 */

const protectedRoutes = ["/account", "/checkout", "/studio"];
const authRoutes = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  // Cookie-only session check — Better Auth sets this cookie
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const hasSession = !!sessionCookie?.value;

  // Protected routes → redirect to sign-in if no session cookie
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Auth routes → redirect to home if already signed in
  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
