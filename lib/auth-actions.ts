"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ─── Constants ─────────────────────────────────────────────────

const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 150;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Result type for client-friendly actions ─────────────────

type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
};

// ─── Client-friendly actions (return results, no redirect) ───

/**
 * Sign up — returns a result object so the client can show
 * loading states, success screens, and inline errors.
 */
export async function signUpAction(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  const { email, password, fullName } = data;

  // ─── Input validation ─────────────────────────────────────
  if (!email || !password || !fullName) {
    return { success: false, error: "All fields are required" };
  }
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { success: false, error: "Password is too long" };
  }
  if (fullName.length < 2 || fullName.length > MAX_NAME_LENGTH) {
    return { success: false, error: "Name must be 2–150 characters" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    const safeMessage = error.message.includes("already registered")
      ? "An account with this email already exists"
      : "Sign up failed. Please try again.";
    return { success: false, error: safeMessage };
  }

  return {
    success: true,
    message: "Check your email to confirm your account",
  };
}

/**
 * Sign in — returns a result object for client-side handling.
 * On success the client should call router.push("/") or router.refresh().
 */
export async function signInAction(data: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { email, password } = data;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: "Invalid email or password" };
  }

  return { success: true };
}

// ─── Legacy form-action based (kept for backward compat) ─────

export async function signUp(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();

  const result = await signUpAction({
    email: email || "",
    password: password || "",
    fullName: fullName || "",
  });

  if (!result.success) {
    return redirect(`/sign-up?error=${encodeURIComponent(result.error!)}`);
  }
  return redirect(`/sign-up?message=${encodeURIComponent(result.message!)}`);
}

export async function signIn(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  const result = await signInAction({
    email: email || "",
    password: password || "",
  });

  if (!result.success) {
    return redirect(`/sign-in?error=${encodeURIComponent(result.error!)}`);
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
  const origin =
    process.env.NEXT_PUBLIC_APP_URL || "https://lookkoolladiesworld.com";

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
    if (error.message.includes("provider")) {
      return redirect(
        `/sign-in?error=${encodeURIComponent(
          "Google sign-in is not configured yet. Please use email/password or contact support."
        )}`
      );
    }
    return redirect(
      `/sign-in?error=${encodeURIComponent("Sign-in failed. Please try again.")}`
    );
  }

  return redirect(data.url);
}
