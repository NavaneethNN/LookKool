"use client";

import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { StaggerChildren, StaggerItem } from "@/components/ui/motion";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Free shipping on orders above \u20b9499",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% secure payment with Razorpay",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day easy return & exchange",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated customer support",
  },
];

export function FeaturesStrip() {
  return (
    <section className="border-y bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <StaggerChildren
          className="grid grid-cols-2 gap-6 sm:gap-8 sm:grid-cols-4"
          staggerDelay={0.1}
        >
          {features.map((f) => (
            <StaggerItem
              key={f.title}
              className="group flex flex-col items-center text-center gap-3"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10 transition-all duration-500 group-hover:bg-primary/15 group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:scale-110 group-hover:-translate-y-1">
                <f.icon className="h-6 w-6 text-primary transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
