import { Metadata } from "next";
import { CartContent } from "./cart-content";
import dynamic from "next/dynamic";

const CartRecommendations = dynamic(
  () =>
    import("@/components/product/cart-recommendations").then(
      (mod) => mod.CartRecommendations
    ),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Shopping Cart – LookKool",
  description: "Review your cart and proceed to checkout.",
};

export default function CartPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl mb-8">Shopping Cart</h1>
      <CartContent />
      <CartRecommendations />
    </main>
  );
}
