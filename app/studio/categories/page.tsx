import { getAdminCategories } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { CategoryActions } from "@/components/admin/category-actions";
import Image from "next/image";


export default async function CategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <>
      <PageHeader
        title="Categories"
        description={`${categories.length} categories`}
      >
        <CategoryActions categories={categories} />
      </PageHeader>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort
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
              {categories.map((cat) => (
                <tr key={cat.categoryId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cat.categoryId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {cat.imageUrl && (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          <Image
                            src={cat.imageUrl}
                            alt={cat.categoryName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {cat.categoryName}
                        </p>
                        {cat.description && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {cat.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cat.parent?.categoryName ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cat.sortOrder}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={cat.isActive ? "Active" : "Inactive"}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <CategoryActions
                      categories={categories}
                      editCategory={cat}
                    />
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
