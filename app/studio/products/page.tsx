import { getAdminProducts } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; category?: string };
}) {
  const page = Number(searchParams.page ?? "1");
  const { products, total, totalPages } = await getAdminProducts({
    page,
    search: searchParams.search,
    categoryId: searchParams.category ? Number(searchParams.category) : undefined,
  });

  return (
    <>
      <PageHeader title="Products" description={`${total} products`}>
        <Link
          href="/studio/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#470B49] text-white text-sm font-medium rounded-lg hover:bg-[#5a1060] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <form className="max-w-md">
          <input
            type="text"
            name="search"
            defaultValue={searchParams.search ?? ""}
            placeholder="Search products by name or code..."
            className="w-full h-10 rounded-lg border border-input bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#470B49]/20 focus:border-[#470B49]"
          />
        </form>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variants
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => {
                const totalStock = product.variants?.reduce(
                  (sum, v) => sum + v.stockCount,
                  0
                ) ?? 0;
                return (
                  <tr key={product.productId} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/studio/products/${product.productId}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#470B49]"
                      >
                        {product.productName}
                      </Link>
                      {product.label && (
                        <span className="ml-2 text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                          {product.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {product.productCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category?.categoryName ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{Number(product.basePrice).toLocaleString("en-IN")}
                      </p>
                      {Number(product.mrp) > Number(product.basePrice) && (
                        <p className="text-xs text-gray-400 line-through">
                          ₹{Number(product.mrp).toLocaleString("en-IN")}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.variants?.length ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          totalStock === 0
                            ? "text-red-600"
                            : totalStock <= 5
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={product.isActive ? "Active" : "Inactive"}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/studio/products/${product.productId}`}
                        className="text-sm text-[#470B49] hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/studio/products?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ""}`}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/studio/products?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ""}`}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
