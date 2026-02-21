import { siteConfig } from "@/lib/constants";

interface ProductJsonLdProps {
  name: string;
  description: string | null;
  slug: string;
  basePrice: number;
  mrp: number;
  images: string[];
  avgRating: number;
  totalReviews: number;
  inStock: boolean;
  category?: string;
  productCode: string;
  storeName?: string;
  storeUrl?: string;
}

export function ProductJsonLd({
  name,
  description,
  slug,
  basePrice,
  mrp,
  images,
  avgRating,
  totalReviews,
  inStock,
  category,
  productCode,
  storeName = "LookKool",
  storeUrl,
}: ProductJsonLdProps) {
  const baseUrl = storeUrl || siteConfig.url;
  const url = `${baseUrl}/products/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || `Buy ${name} at ${storeName}`,
    image: images,
    url,
    sku: productCode,
    brand: {
      "@type": "Brand",
      name: storeName,
    },
    ...(category && {
      category,
    }),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: basePrice,
      ...(mrp > basePrice && {
        priceValidUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString().split("T")[0],
      }),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: storeName,
      },
    },
    ...(totalReviews > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: totalReviews,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
