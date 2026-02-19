import { Metadata } from "next";
import { WishlistContent } from "./wishlist-content";

export const metadata: Metadata = {
  title: "Wishlist – LookKool",
  description: "Your saved products on LookKool.",
};

export default function WishlistPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl mb-8">My Wishlist</h1>
      <WishlistContent />
    </main>
  );
}
