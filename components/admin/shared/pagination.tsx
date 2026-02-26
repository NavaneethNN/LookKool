"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Called with the new page number */
  onPageChange: (page: number) => void;
  /** Total record count (optional, shown as "Showing X of Y") */
  total?: number;
  /** Items per page (used with total to compute "Showing X-Y") */
  pageSize?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize = 20,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total ?? page * pageSize);

  return (
    <div
      className={`flex items-center justify-between gap-4 ${className ?? ""}`}
    >
      {total !== undefined ? (
        <span className="text-sm text-muted-foreground">
          Showing {start}–{end} of {total}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
