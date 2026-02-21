"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ─── Constants ─────────────────────────────────────────────────

const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 150;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Email / Password ────────────────────────────────────────

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();

  // ─── Input validation ─────────────────────────────────────
  if (!email || !password || !fullName) {
    return redirect(`/sign-up?error=${encodeURIComponent("All fields are required")}`);
  }
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return redirect(`/sign-up?error=${encodeURIComponent("Please enter a valid email address")}`);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return redirect(`/sign-up?error=${encodeURIComponent(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)}`);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return redirect(`/sign-up?error=${encodeURIComponent("Password is too long")}`);
  }
  if (fullName.length < 2 || fullName.length > MAX_NAME_LENGTH) {
    return redirect(`/sign-up?error=${encodeURIComponent("Name must be 2–150 characters")}`);
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    // Sanitize error message — don't leak internals
    const safeMessage = error.message.includes("already registered")
      ? "An account with this email already exists"
      : "Sign up failed. Please try again.";
    return redirect(`/sign-up?error=${encodeURIComponent(safeMessage)}`);
  }

  return redirect("/sign-up?message=Check your email to confirm your account");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return redirect(`/sign-in?error=${encodeURIComponent("Email and password are required")}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic error to prevent user enumeration
    return redirect(`/sign-in?error=${encodeURIComponent("Invalid email or password")}`);
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
  // Use environment variable for origin — NEVER trust request headers
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
    return redirect(`/sign-in?error=${encodeURIComponent("Sign-in failed. Please try again.")}`);
  }

  return redirect(data.url);
}
