import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  // Order statuses
  Pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  Processing: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Packed: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  Shipped: "bg-purple-50 text-purple-700 ring-purple-600/20",
  Delivered: "bg-green-50 text-green-700 ring-green-600/20",
  Cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  Refunded: "bg-orange-50 text-orange-700 ring-orange-600/20",
  // Payment statuses
  Completed: "bg-green-50 text-green-700 ring-green-600/20",
  Failed: "bg-red-50 text-red-700 ring-red-600/20",
  // Return statuses
  Approved: "bg-green-50 text-green-700 ring-green-600/20",
  Rejected: "bg-red-50 text-red-700 ring-red-600/20",
  // Boolean
  Active: "bg-green-50 text-green-700 ring-green-600/20",
  Inactive: "bg-gray-50 text-gray-600 ring-gray-500/20",
  // Payment issues
  PENDING: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  RESOLVED: "bg-green-50 text-green-700 ring-green-600/20",
  REFUNDED: "bg-orange-50 text-orange-700 ring-orange-600/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        statusStyles[status] ?? "bg-gray-50 text-gray-600 ring-gray-500/20",
        className
      )}
    >
      {status}
    </span>
  );
}
