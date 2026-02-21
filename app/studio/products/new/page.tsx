import { getAdminCategories } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

const ProductForm = dynamic(
  () => import("@/components/admin/product-form").then(m => m.ProductForm),
  { loading: () => <div className="animate-pulse rounded-xl border bg-white shadow-sm p-6 space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 w-full rounded-lg bg-muted" />)}</div> }
);

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
