import { getAdminReturns } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ReturnResolve } from "@/components/admin/return-resolve";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");
  const status = sp.status || undefined;

  const { returns, total, totalPages } = await getAdminReturns({
    page,
    status,
  });

  const statuses = [
    "all",
    "Pending",
    "Approved",
    "Rejected",
    "Refunded",
  ];

  return (
    <>
      <PageHeader title="Returns" description={`${total} return requests`} />

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/studio/returns${s === "all" ? "" : `?status=${s}`}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              (s === "all" && !status) || s === status
                ? "bg-primary text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Return #</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((r) => (
              <TableRow key={r.returnId}>
                <TableCell className="font-medium">#{r.returnId}</TableCell>
                <TableCell>
                  <Link
                    href={`/studio/orders/${r.orderId}`}
                    className="text-primary hover:underline font-medium"
                  >
                    #{r.orderId}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">
                  {r.user?.name || r.user?.email || "—"}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">
                  {r.orderItem?.productName || "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-600 max-w-[200px]">
                  <span className="line-clamp-2">{r.reason}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={r.status}
                  />
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    dateStyle: "medium",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <ReturnResolve
                    returnId={r.returnId}
                    currentStatus={r.status}
                  />
                </TableCell>
              </TableRow>
            ))}
            {returns.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  No return requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/studio/returns?page=${page - 1}${status ? `&status=${status}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/studio/returns?page=${page + 1}${status ? `&status=${status}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
