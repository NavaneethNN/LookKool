import {
  getAdminProduct,
  getAdminCategories,
  getProductStockSummary,
} from "@/lib/actions/admin-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { ProductDetailActions } from "@/components/admin/product-detail-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Clock,
} from "lucide-react";

const ProductForm = dynamic(
  () => import("@/components/admin/product-form").then(m => m.ProductForm),
  { loading: () => <div className="animate-pulse rounded-xl border bg-white shadow-sm p-6 space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 w-full rounded-lg bg-muted" />)}</div> }
);

const VariantManager = dynamic(
  () => import("@/components/admin/variant-manager").then(m => m.VariantManager),
  { loading: () => <div className="animate-pulse rounded-xl border bg-white shadow-sm p-6"><div className="h-8 w-48 rounded bg-muted mb-4" /><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 w-full rounded-lg bg-muted" />)}</div></div> }
);

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (isNaN(productId)) notFound();

  const [product, categories, stockSummary] = await Promise.all([
    getAdminProduct(productId),
    getAdminCategories(),
    getProductStockSummary(productId),
  ]);

  if (!product) notFound();

  const createdDate = new Date(product.createdAt).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  );
  const updatedDate = new Date(product.updatedAt).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <>
      <Link
        href="/studio/products"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">
              {product.productName}
            </h1>
            <StatusBadge
              status={product.isActive ? "Active" : "Inactive"}
            />
            {product.label && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                {product.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="font-mono">{product.productCode}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Created {createdDate}
            </span>
            <span>·</span>
            <span>Updated {updatedDate}</span>
          </div>
        </div>

        {/* Action buttons */}
        <ProductDetailActions
          productId={product.productId}
          slug={product.slug}
          isActive={product.isActive}
        />
      </div>

      {/* ── Stock Summary Cards ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase">
              Total Stock
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              stockSummary.totalStock === 0
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {stockSummary.totalStock}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            across {stockSummary.totalVariants} variants
          </p>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase">
              Variants
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stockSummary.totalVariants}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Set(
              product.variants?.map((v) => v.color).filter(Boolean)
            ).size}{" "}
            colors ·{" "}
            {new Set(
              product.variants?.map((v) => v.size).filter(Boolean)
            ).size}{" "}
            sizes
          </p>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-gray-500 uppercase">
              Out of Stock
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              stockSummary.outOfStock > 0
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {stockSummary.outOfStock}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stockSummary.outOfStock > 0
              ? "variants need restocking"
              : "all variants in stock"}
          </p>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-gray-500 uppercase">
              Low Stock
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              stockSummary.lowStock > 0
                ? "text-amber-600"
                : "text-green-600"
            }`}
          >
            {stockSummary.lowStock}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            variants with ≤ 5 units
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <ProductForm categories={categories} product={product} />

        {/* Variants Section */}
        <VariantManager
          productId={product.productId}
          variants={product.variants ?? []}
        />
      </div>
    </>
  );
}
