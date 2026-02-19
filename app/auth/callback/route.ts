import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/brevo";

/**
 * GET /auth/callback
 * Handles the OAuth redirect from Supabase (Google sign-in).
 * Exchanges the `code` query param for a session, then redirects home.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email for first-time users (fire-and-forget)
      try {
        const user = data?.session?.user;
        if (user?.email) {
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email.split("@")[0];
          sendWelcomeEmail({ name, email: user.email }).catch(() => {});
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
