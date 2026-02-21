import { ImageResponse } from "next/og";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPublicSiteConfig } from "@/lib/site-config";

export const alt = "Product image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const [[product], siteConfig] = await Promise.all([
    db
      .select({
        productName: products.productName,
        basePrice: products.basePrice,
        mrp: products.mrp,
        label: products.label,
      })
      .from(products)
      .where(eq(products.slug, params.slug))
      .limit(1),
    getPublicSiteConfig(),
  ]);

  const name = product?.productName || "Product";
  const price = product ? `₹${parseFloat(product.basePrice).toLocaleString("en-IN")}` : "";
  const mrp = product?.mrp && parseFloat(product.mrp) > parseFloat(product.basePrice)
    ? `₹${parseFloat(product.mrp).toLocaleString("en-IN")}`
    : null;
  const label = product?.label || null;
  const brandColor = siteConfig.sitePrimaryColor || "#470B49";
  const storeName = siteConfig.businessName;
  // derive a slightly lighter shade for the mid-gradient
  const gradientMid = brandColor; // fallback same color
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
          background: `linear-gradient(135deg, ${brandColor} 0%, ${gradientMid} 50%, ${brandColor} 100%)`,
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

        {/* Label badge */}
        {label && (
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 50,
              backgroundColor: "#f59e0b",
              color: "white",
              padding: "6px 20px",
              borderRadius: 20,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {label}
          </div>
        )}

        {/* Product name */}
        <div
          style={{
            color: "white",
            fontSize: 52,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
            padding: "0 40px",
          }}
        >
          {name}
        </div>

        {/* Price */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 24,
          }}
        >
          <span style={{ color: "white", fontSize: 40, fontWeight: 700 }}>
            {price}
          </span>
          {mrp && (
            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 28,
                textDecoration: "line-through",
              }}
            >
              {mrp}
            </span>
          )}
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
