"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bell, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { subscribeToNewsletter } from "@/lib/actions/newsletter.actions";
import { FadeIn, motion } from "@/components/ui/motion";

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
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

      {/* Floating decorative orbs */}
      <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/[0.04] blur-3xl animate-float-slow" />
      <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/[0.03] blur-3xl animate-float-reverse" />

      {/* Animated floating sparkles */}
      <motion.div
        className="absolute top-8 left-[15%]"
        animate={{ y: [-5, 5, -5], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-4 w-4 text-white/20" />
      </motion.div>
      <motion.div
        className="absolute bottom-12 right-[20%]"
        animate={{ y: [5, -5, 5], opacity: [0.2, 0.5, 0.2] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <Sparkles className="h-5 w-5 text-white/15" />
      </motion.div>

      <div className="container relative mx-auto px-4 py-16 sm:py-24 text-center">
        {subscribed ? (
          <FadeIn direction="up">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20"
              >
                <CheckCircle2 className="h-8 w-8" />
              </motion.div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                You&apos;re in!
              </h2>
              <p className="text-sm text-white/70 max-w-xs mx-auto leading-relaxed">
                Thanks for subscribing. Expect early access, exclusive drops,
                and style tips straight to your inbox.
              </p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn direction="up">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 mb-6">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              Stay in the Loop
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed">
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
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 rounded-xl backdrop-blur-sm"
                required
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full sm:w-auto shrink-0 bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/10 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
