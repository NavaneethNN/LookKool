"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { toast } from "sonner";

interface Category {
  categoryId: number;
  categoryName: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    productId: number;
    productName: string;
    slug: string;
    description: string | null;
    categoryId: number;
    basePrice: string;
    mrp: string;
    productCode: string;
    material: string | null;
    fabricWeight: string | null;
    careInstructions: string | null;
    origin: string | null;
    detailHtml: string | null;
    label: string | null;
    isActive: boolean;
    priority: number;
  };
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    productName: product?.productName ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? (categories[0]?.categoryId ?? 0),
    basePrice: product?.basePrice ?? "",
    mrp: product?.mrp ?? "",
    productCode: product?.productCode ?? "",
    label: product?.label ?? "",
    isActive: product?.isActive ?? true,
    priority: product?.priority ?? 99,
    detailHtml: product?.detailHtml ?? "",
    // Legacy — kept for backward compat but not shown in UI
    material: product?.material ?? "",
    fabricWeight: product?.fabricWeight ?? "",
    careInstructions: product?.careInstructions ?? "",
    origin: product?.origin ?? "",
  });

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));

    // Auto-generate slug from name
    if (name === "productName" && !product) {
      setForm((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.productName || !form.basePrice || !form.productCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        if (product) {
          await updateProduct(product.productId, {
            ...form,
            categoryId: Number(form.categoryId),
          });
          toast.success("Product updated");
        } else {
          const newProduct = await createProduct({
            ...form,
            categoryId: Number(form.categoryId),
          });
          toast.success("Product created");
          router.push(`/studio/products/${newProduct.productId}`);
        }
      } catch {
        toast.error("Failed to save product");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Product Name *
            </label>
            <Input
              name="productName"
              value={form.productName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Slug *
            </label>
            <Input name="slug" value={form.slug} onChange={handleChange} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Product Code *
            </label>
            <Input
              name="productCode"
              value={form.productCode}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Category *
            </label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Description
            </label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Pricing &amp; Settings
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Base Price (₹) *
            </label>
            <Input
              name="basePrice"
              value={form.basePrice}
              onChange={handleChange}
              type="number"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              MRP (₹)
            </label>
            <Input
              name="mrp"
              value={form.mrp}
              onChange={handleChange}
              type="number"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Label (badge)
            </label>
            <Input
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Sale, Trending, New..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Priority
            </label>
            <Input
              name="priority"
              value={form.priority}
              onChange={handleChange}
              type="number"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={form.isActive}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            className="h-4 w-4 rounded border-gray-300 text-[#470B49] focus:ring-[#470B49]"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Active — visible to customers
          </label>
        </div>
      </div>

      {/* Product Details (Rich Text) */}
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Product Details
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Material, care instructions, origin, sizing — all in one rich text
          editor. Shown in the &ldquo;Details&rdquo; tab on the storefront.
        </p>
        <RichTextEditor
          value={form.detailHtml}
          onChange={(html) =>
            setForm((prev) => ({ ...prev, detailHtml: html }))
          }
          placeholder="Add product details — material, care instructions, origin, sizing guide…"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#470B49] hover:bg-[#5a1060]"
        >
          {isPending
            ? "Saving..."
            : product
            ? "Update Product"
            : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
