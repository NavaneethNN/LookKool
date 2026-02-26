import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * GET /auth/callback
 * Handles the OAuth redirect from Supabase (Google sign-in).
 * Exchanges the `code` query param for a session, then redirects home.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  // Determine correct origin — prefer x-forwarded-host (Vercel proxy) → env var → request URL
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin);

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email for first-time users only (fire-and-forget)
      try {
        const user = data?.session?.user;
        if (user?.email) {
          // Check created_at — if the user was created within the last 60 seconds, it's a new signup
          const createdAt = user.created_at ? new Date(user.created_at) : null;
          const isNewUser = createdAt && Date.now() - createdAt.getTime() < 60_000;

          if (isNewUser) {
            const name =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email.split("@")[0];
            sendWelcomeEmail({ name, email: user.email }).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send to sign-in with an error
  return NextResponse.redirect(`${origin}/sign-in?error=Could not authenticate`);
}
