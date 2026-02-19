import { Truck, ShieldCheck, RotateCcw, Headphones, type LucideIcon } from "lucide-react";

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
    <section className="border-y bg-muted/40">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
