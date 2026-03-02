"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Mail, Wand2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type Tab = "password" | "magic";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function SignInPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Sign in failed");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: "/",
      });

      if (result.error) {
        setError(result.error.message || "Failed to send magic link");
      } else {
        setMagicSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  }

  if (magicSent) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <motion.div
          className="w-full max-w-sm text-center space-y-5"
          {...fadeUp}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Mail className="h-7 w-7 text-primary" />
          </motion.div>
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a sign-in link to <strong>{email}</strong>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMagicSent(false)}
            className="rounded-full"
          >
            Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-sm space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Card wrapper */}
        <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-black/[0.03] space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl transition-all duration-300 hover:shadow-sm hover:border-border"
            onClick={handleGoogleSignIn}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setTab("password")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                tab === "password"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="inline-block mr-1.5 h-3.5 w-3.5" />
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setTab("magic")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                tab === "magic"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wand2 className="inline-block mr-1.5 h-3.5 w-3.5" />
              Magic Link
            </button>
          </div>

          {error && (
            <motion.div
              className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          {tab === "password" ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl shadow-sm shadow-primary/20 transition-all duration-300 hover:shadow-md hover:shadow-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl shadow-sm shadow-primary/20 transition-all duration-300 hover:shadow-md hover:shadow-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Magic Link
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            If you had an account before, please{" "}
            <Link
              href="/forgot-password"
              className="text-primary hover:underline font-medium"
            >
              reset your password
            </Link>{" "}
            to continue.
          </p>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
