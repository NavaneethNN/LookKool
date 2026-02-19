import { getAdminCustomers } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import Link from "next/link";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const page = Number(searchParams.page ?? "1");
  const { customers, total, totalPages } = await getAdminCustomers({
    page,
    search: searchParams.search,
  });

  return (
    <>
      <PageHeader title="Customers" description={`${total} registered users`} />

      {/* Search */}
      <div className="mb-6">
        <form className="max-w-md">
          <input
            type="text"
            name="search"
            defaultValue={searchParams.search ?? ""}
            placeholder="Search by name or email..."
            className="w-full h-10 rounded-lg border border-input bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#470B49]/20 focus:border-[#470B49]"
          />
        </form>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.userId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-400">{customer.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.phoneNumber ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={customer.role === "admin" ? "Active" : "Inactive"}
                      className={
                        customer.role === "admin"
                          ? ""
                          : "!bg-gray-50 !text-gray-500 !ring-gray-200"
                      }
                    />
                    <span className="ml-1 text-xs text-gray-500 capitalize">
                      {customer.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.orderCount}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ₹{Number(customer.totalSpent).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/studio/customers/${customer.userId}`}
                      className="text-sm text-[#470B49] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/studio/customers?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ""}`}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/studio/customers?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ""}`}
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
