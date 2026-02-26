"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bell, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { subscribeToNewsletter } from "@/lib/actions/newsletter.actions";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    const result = await subscribeToNewsletter(trimmed);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Subscribed successfully!", {
        description: "You will hear from us with the latest drops.",
      });
      setEmail("");
      setSubscribed(true);
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
      <div className="container relative mx-auto px-4 py-14 sm:py-20 text-center">

        {subscribed ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">You&apos;re in!</h2>
            <p className="text-sm text-white/70 max-w-xs mx-auto leading-relaxed">
              Thanks for subscribing. Expect early access, exclusive drops, and
              style tips straight to your inbox.
            </p>
          </div>
        ) : (
          /* ── Subscribe form ── */
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 mb-6">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Stay in the Loop
            </h2>
            <p className="mt-3 text-sm text-white/70 max-w-md mx-auto leading-relaxed">
              Subscribe to get early access to new drops, exclusive offers &amp;
              style tips. No spam, ever.
            </p>
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                required
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full sm:w-auto shrink-0 bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
