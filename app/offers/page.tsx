import { redirect } from "next/navigation";

/**
 * /offers — redirects to the shop page.
 * When a dedicated offers system is built, this can be expanded.
 */
export default function OffersPage() {
  redirect("/shop");
}
