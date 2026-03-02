import { getCachedCategories } from "@/lib/cached-data";
import { FeaturedCategoriesClient } from "./featured-categories-client";

export async function FeaturedCategories() {
  const dbCategories = await getCachedCategories();
  return <FeaturedCategoriesClient categories={dbCategories} />;
}
