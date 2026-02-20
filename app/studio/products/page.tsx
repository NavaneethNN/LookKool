import {
  getAdminProducts,
  getAdminCategories,
} from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsList } from "@/components/admin/products-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    order?: string;
  };
}) {
  const page = Number(searchParams.page ?? "1");
  const activeFilter =
    searchParams.status === "active"
      ? true
      : searchParams.status === "inactive"
      ? false
      : undefined;

  const [result, categories] = await Promise.all([
    getAdminProducts({
      page,
      search: searchParams.search,
      categoryId: searchParams.category
        ? Number(searchParams.category)
        : undefined,
      active: activeFilter,
      sort: searchParams.sort,
      order: (searchParams.order as "asc" | "desc") ?? undefined,
    }),
    getAdminCategories(),
  ]);

  return (
    <>
      <PageHeader title="Products" description={`${result.total} products`}>
        <Link
          href="/studio/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#470B49] text-white text-sm font-medium rounded-lg hover:bg-[#5a1060] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </PageHeader>

      <ProductsList
        products={result.products as any}
        categories={categories}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentFilters={{
          search: searchParams.search,
          category: searchParams.category,
          status: searchParams.status,
          sort: searchParams.sort,
          order: searchParams.order,
        }}
      />
    </>
  );
}
