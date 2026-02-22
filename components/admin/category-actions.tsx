"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

interface Category {
  categoryId: number;
  categoryName: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentCategoryId: number | null;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryActionsProps {
  categories: Category[];
  editCategory?: Category;
}

export function CategoryActions({
  categories,
  editCategory,
}: CategoryActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEdit = !!editCategory;

  const [form, setForm] = useState({
    categoryName: editCategory?.categoryName ?? "",
    slug: editCategory?.slug ?? "",
    description: editCategory?.description ?? "",
    imageUrl: editCategory?.imageUrl ?? "",
    parentCategoryId: editCategory?.parentCategoryId ?? null,
    isActive: editCategory?.isActive ?? true,
    sortOrder: editCategory?.sortOrder ?? 99,
  });

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleSubmit() {
    if (!form.categoryName || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }

    startTransition(async () => {
      try {
        if (isEdit && editCategory) {
          await updateCategory(editCategory.categoryId, {
            ...form,
            parentCategoryId: form.parentCategoryId || null,
          });
          toast.success("Category updated");
        } else {
          await createCategory({
            ...form,
            parentCategoryId: form.parentCategoryId || null,
          });
          toast.success("Category created");
        }
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save category");
      }
    });
  }

  function handleDelete() {
    if (!editCategory) return;
    if (!confirm("Delete this category? Products in this category will be affected."))
      return;

    startTransition(async () => {
      try {
        await deleteCategory(editCategory.categoryId);
        toast.success("Category deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete category");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 text-gray-400 hover:text-primary rounded transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" />
            Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Category" : "New Category"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Name *
            </label>
            <Input
              value={form.categoryName}
              onChange={(e) => {
                setForm((p) => ({
                  ...p,
                  categoryName: e.target.value,
                  ...(!isEdit ? { slug: generateSlug(e.target.value) } : {}),
                }));
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Slug *
            </label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Image
            </label>
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
              folder={`categories/${form.slug || "new"}`}
              size={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Parent Category
            </label>
            <select
              value={form.parentCategoryId ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  parentCategoryId: e.target.value
                    ? Number(e.target.value)
                    : null,
                }))
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => c.categoryId !== editCategory?.categoryId)
                .map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Sort Order
              </label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {isPending
                ? "Saving..."
                : isEdit
                ? "Update"
                : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
