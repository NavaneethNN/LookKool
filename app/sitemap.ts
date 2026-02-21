import { MetadataRoute } from "next";
import { getCachedProductSlugs, getCachedCategorySlugs } from "@/lib/cached-data";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://lookkoolladiesworld.com";

// Revalidate sitemap every 60 minutes
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/cart`,
      changeFrequency: "weekly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/wishlist`,
      changeFrequency: "weekly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/search`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/shop`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sign-in`,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/sign-up`,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  // Category pages — cached query
  const allCategories = await getCachedCategorySlugs();
  const categoryPages: MetadataRoute.Sitemap = allCategories.map((cat) => ({
    url: `${BASE_URL}/categories/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Product pages — cached query
  const allProducts = await getCachedProductSlugs();
  const productPages: MetadataRoute.Sitemap = allProducts.map((prod) => ({
    url: `${BASE_URL}/products/${prod.slug}`,
    lastModified: prod.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
