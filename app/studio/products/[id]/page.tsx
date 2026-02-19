import {
  getAdminProduct,
  getAdminCategories,
} from "@/lib/actions/admin-actions";
import { ProductForm } from "@/components/admin/product-form";
import { VariantManager } from "@/components/admin/variant-manager";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = Number(params.id);
  if (isNaN(productId)) notFound();

  const [product, categories] = await Promise.all([
    getAdminProduct(productId),
    getAdminCategories(),
  ]);

  if (!product) notFound();

  return (
    <>
      <Link
        href="/studio/products"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <PageHeader title={product.productName}>
        <StatusBadge status={product.isActive ? "Active" : "Inactive"} />
      </PageHeader>

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
