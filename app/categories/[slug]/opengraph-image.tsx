import { ImageResponse } from "next/og";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPublicSiteConfig } from "@/lib/site-config";

export const alt = "Category image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const [[category], siteConfig] = await Promise.all([
    db
      .select({
        categoryName: categories.categoryName,
        description: categories.description,
      })
      .from(categories)
      .where(eq(categories.slug, params.slug))
      .limit(1),
    getPublicSiteConfig(),
  ]);

  const name = category?.categoryName || "Category";
  const desc = category?.description || "Browse our collection";
  const brandColor = siteConfig.sitePrimaryColor || "#470B49";
  const storeName = siteConfig.businessName;
  const initials = storeName.slice(0, 2).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor} 50%, ${brandColor} 100%)`,
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 50,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 22 }}>
            {storeName}
          </span>
        </div>

        {/* Category name */}
        <div
          style={{
            color: "white",
            fontSize: 56,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>

        {/* Description */}
        <div
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 24,
            textAlign: "center",
            maxWidth: 700,
            marginTop: 16,
            lineHeight: 1.4,
          }}
        >
          {desc.length > 120 ? desc.slice(0, 120) + "…" : desc}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            color: "rgba(255,255,255,0.5)",
            fontSize: 18,
          }}
        >
          {siteConfig.siteDescription || `Shop at ${storeName}`}
        </div>
      </div>
    ),
    { ...size }
  );
}
