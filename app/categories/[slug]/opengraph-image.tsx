import { ImageResponse } from "next/og";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const alt = "Category image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const [category] = await db
    .select({
      categoryName: categories.categoryName,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.slug, params.slug))
    .limit(1);

  const name = category?.categoryName || "Category";
  const desc = category?.description || "Browse our collection";

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
          background: "linear-gradient(135deg, #470B49 0%, #8B2E8E 50%, #470B49 100%)",
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
            LK
          </div>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 22 }}>
            LookKool
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
          Shop trendy women&apos;s fashion at LookKool
        </div>
      </div>
    ),
    { ...size }
  );
}
