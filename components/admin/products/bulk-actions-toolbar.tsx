"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, EyeOff, Trash2, X } from "lucide-react";

interface Category {
  categoryId: number;
  categoryName: string;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  isPending: boolean;
  bulkDeleteConfirm: boolean;
  categories: Category[];
  onBulkActivate: (active: boolean) => void;
  onBulkCategory: (catId: number) => void;
  onBulkDeleteRequest: () => void;
  onBulkDeleteConfirm: () => void;
  onBulkDeleteCancel: () => void;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  isPending,
  bulkDeleteConfirm,
  categories,
  onBulkActivate,
  onBulkCategory,
  onBulkDeleteRequest,
  onBulkDeleteConfirm,
  onBulkDeleteCancel,
  onClearSelection,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 animate-in slide-in-from-top-2">
      <span className="text-sm font-medium text-primary">
        {selectedCount} selected
      </span>
      <div className="h-5 w-px bg-primary/20" />
      <Button
        size="sm"
        variant="outline"
        onClick={() => onBulkActivate(true)}
        disabled={isPending}
        className="h-8 text-xs"
      >
        <Eye className="w-3.5 h-3.5 mr-1" />
        Activate
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onBulkActivate(false)}
        disabled={isPending}
        className="h-8 text-xs"
      >
        <EyeOff className="w-3.5 h-3.5 mr-1" />
        Deactivate
      </Button>

      {/* Bulk Category Change */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            className="h-8 text-xs"
          >
            Move to category
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
          {categories.map((cat) => (
            <DropdownMenuItem
              key={cat.categoryId}
              onClick={() => onBulkCategory(cat.categoryId)}
            >
              {cat.categoryName}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto" />
      {!bulkDeleteConfirm ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onBulkDeleteRequest}
          disabled={isPending}
          className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Delete
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-600 font-medium">
            Delete {selectedCount} products?
          </span>
          <Button
            size="sm"
            onClick={onBulkDeleteConfirm}
            disabled={isPending}
            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onBulkDeleteCancel}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
      <button
        onClick={onClearSelection}
        className="p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
