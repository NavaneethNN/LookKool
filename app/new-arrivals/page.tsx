import { redirect } from "next/navigation";

/**
 * /new-arrivals — redirects to the shop page sorted by newest.
 */
export default function NewArrivalsPage() {
  redirect("/shop?sort=newest");
}
