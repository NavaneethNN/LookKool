import { getAdminOrders } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import Link from "next/link";

const statusFilters = [
  "all",
  "Pending",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "all";
  const page = Number(sp.page ?? "1");
  const { orders, total, totalPages } = await getAdminOrders({ status, page });

  return (
    <>
      <PageHeader title="Orders" description={`${total} total orders`} />

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((s) => (
          <Link
            key={s}
            href={`/studio/orders${s === "all" ? "" : `?status=${s}`}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              status === s
                ? "bg-primary text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "All" : s}
          </Link>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/studio/orders/${order.orderId}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      #{order.orderId}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">
                      {order.user?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.user?.email ?? "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.orderDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.items?.length ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No orders found
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
                  href={`/studio/orders?status=${status}&page=${page - 1}`}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/studio/orders?status=${status}&page=${page + 1}`}
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
