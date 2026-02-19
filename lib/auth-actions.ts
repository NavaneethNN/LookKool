"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// ─── Email / Password ────────────────────────────────────────

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  return redirect("/sign-up?message=Check your email to confirm your account");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  return redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
}

// ─── Google OAuth ────────────────────────────────────────────

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    // Common: Google provider not enabled in Supabase dashboard
    if (error.message.includes("provider")) {
      return redirect(
        `/sign-in?error=${encodeURIComponent(
          "Google sign-in is not configured yet. Please use email/password or contact support."
        )}`
      );
    }
    return redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  return redirect(data.url);
}
