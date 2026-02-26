import { getAdminProducts } from "@/lib/actions/product.actions";
import { getAdminCategories } from "@/lib/actions/category.actions";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsList } from "@/components/admin/products/products-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");
  const activeFilter =
    sp.status === "active"
      ? true
      : sp.status === "inactive"
      ? false
      : undefined;

  const [result, categories] = await Promise.all([
    getAdminProducts({
      page,
      search: sp.search,
      categoryId: sp.category
        ? Number(sp.category)
        : undefined,
      active: activeFilter,
      sort: sp.sort,
      order: (sp.order as "asc" | "desc") ?? undefined,
    }),
    getAdminCategories(),
  ]);

  return (
    <>
      <PageHeader title="Products" description={`${result.total} products`}>
        <Link
          href="/studio/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </PageHeader>

      <ProductsList
        products={result.products as never[]}
        categories={categories}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentFilters={{
          search: sp.search,
          category: sp.category,
          status: sp.status,
          sort: sp.sort,
          order: sp.order,
        }}
      />
    </>
  );
}
