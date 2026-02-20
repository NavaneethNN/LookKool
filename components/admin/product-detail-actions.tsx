"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProduct,
  duplicateProduct,
  toggleProductActive,
} from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface ProductDetailActionsProps {
  productId: number;
  slug: string;
  isActive: boolean;
}

export function ProductDetailActions({
  productId,
  slug,
  isActive,
}: ProductDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  function handleDuplicate() {
    startTransition(async () => {
      try {
        const p = await duplicateProduct(productId);
        toast.success("Product duplicated — editing the copy now");
        router.push(`/studio/products/${p.productId}`);
      } catch {
        toast.error("Failed to duplicate product");
      }
    });
  }

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleProductActive(productId, !isActive);
        toast.success("Status updated");
        router.refresh();
      } catch {
        toast.error("Failed to update status");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProduct(productId);
        toast.success("Product deleted");
        router.push("/studio/products");
      } catch {
        toast.error("Failed to delete product");
      }
    });
  }

  if (deleteConfirm) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
        <Trash2 className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-700 font-medium">
          Permanently delete this product and all its variants?
        </span>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Yes, Delete"
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDeleteConfirm(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDuplicate}
        disabled={isPending}
        className="gap-1.5"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
        Duplicate
      </Button>

      <a
        href={`/products/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        View on Store
      </a>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-2">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleToggle}>
            <EyeOff className="w-4 h-4 mr-2" />
            Toggle Active/Inactive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteConfirm(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Product
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
