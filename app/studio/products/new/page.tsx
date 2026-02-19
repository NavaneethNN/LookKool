import { getAdminCategories } from "@/lib/actions/admin-actions";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/page-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <>
      <Link
        href="/studio/products"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <PageHeader title="New Product" />
      <ProductForm categories={categories} />
    </>
  );
}
