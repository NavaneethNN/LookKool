"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Tag,
  DollarSign,
  Info,
  FileText,
  Settings,
  Percent,
  ArrowLeft,
} from "lucide-react";

interface Category {
  categoryId: number;
  categoryName: string;
  parentCategory?: { categoryName: string } | null;
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
    material: product?.material ?? "",
    fabricWeight: product?.fabricWeight ?? "",
    careInstructions: product?.careInstructions ?? "",
    origin: product?.origin ?? "",
  });

  // Auto-calculated discount
  const discount = useMemo(() => {
    const b = Number(form.basePrice);
    const m = Number(form.mrp);
    if (m <= b || m === 0 || !b) return 0;
    return Math.round(((m - b) / m) * 100);
  }, [form.basePrice, form.mrp]);

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

    // Auto-generate slug from name on create
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
          toast.success("Product updated successfully");
        } else {
          const newProduct = await createProduct({
            ...form,
            categoryId: Number(form.categoryId),
          });
          toast.success("Product created — now add variants & images");
          router.push(`/studio/products/${newProduct.productId}`);
        }
      } catch {
        toast.error("Failed to save product");
      }
    });
  }

  // Group categories for display
  const groupedCategories = useMemo(() => {
    const parents = categories.filter(
      (c) => !(c as any).parentCategoryId
    );
    const children = categories.filter(
      (c) => (c as any).parentCategoryId
    );
    const result: { id: number; name: string; isChild?: boolean }[] = [];
    for (const p of parents) {
      result.push({ id: p.categoryId, name: p.categoryName });
      for (const c of children) {
        if ((c as any).parentCategoryId === p.categoryId) {
          result.push({
            id: c.categoryId,
            name: `  └ ${c.categoryName}`,
            isChild: true,
          });
        }
      }
    }
    // Any orphan children
    for (const c of children) {
      if (!result.find((r) => r.id === c.categoryId)) {
        result.push({ id: c.categoryId, name: c.categoryName });
      }
    }
    return result.length > 0 ? result : categories.map(c => ({ id: c.categoryId, name: c.categoryName }));
  }, [categories]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section 1: Basic Information ──────────────── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Basic Information
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Product Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                placeholder="e.g. Silk Saree — Kanchipuram Collection"
                required
                className="text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  className="font-mono text-sm"
                />
                {form.slug && (
                  <p className="text-xs text-gray-400 mt-1">
                    /products/{form.slug}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Product Code <span className="text-red-500">*</span>
              </label>
              <Input
                name="productCode"
                value={form.productCode}
                onChange={handleChange}
                placeholder="e.g. SKS-001"
                required
                className="font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {groupedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Label / Badge
              </label>
              <div className="flex items-center gap-2">
                <Input
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  placeholder="New, Trending, Sale..."
                  className="flex-1"
                />
                {form.label && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-50 text-purple-700 border-0 whitespace-nowrap"
                  >
                    {form.label}
                  </Badge>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Short Description
              </label>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="A brief one-liner shown on category pages and search results..."
                className="resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {(form.description?.length || 0)}/300 characters — used in
                product cards & meta description
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Pricing ───────────────────────── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Pricing</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <Input
                name="basePrice"
                value={form.basePrice}
                onChange={handleChange}
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
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
                min="0"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Discount
              </label>
              <div className="h-10 rounded-lg border border-input bg-gray-50 px-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-gray-400" />
                <span
                  className={`text-sm font-medium ${
                    discount > 0 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {discount > 0 ? `${discount}% off` : "—"}
                </span>
              </div>
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
                min="0"
                placeholder="99"
              />
              <p className="text-xs text-gray-400 mt-1">
                Lower = shown first
              </p>
            </div>
          </div>

          {/* Margin info */}
          {Number(form.basePrice) > 0 && Number(form.mrp) > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                Customer saves:{" "}
                <span className="font-medium text-green-600">
                  ₹
                  {(
                    Number(form.mrp) - Number(form.basePrice)
                  ).toLocaleString("en-IN")}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Product Details ───────────────── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Product Details
          </h3>
          <span className="text-xs text-gray-400 ml-auto">
            Rich text — shown in storefront &ldquo;Details&rdquo; tab
          </span>
        </div>
        <div className="p-6">
          <RichTextEditor
            value={form.detailHtml}
            onChange={(html) =>
              setForm((prev) => ({ ...prev, detailHtml: html }))
            }
            placeholder="Add product details — material, care instructions, origin, sizing guide…"
          />
        </div>
      </div>

      {/* ── Section 4: Additional Attributes ─────────── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Additional Attributes
          </h3>
          <span className="text-xs text-gray-400 ml-auto">
            Optional product metadata
          </span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Material
              </label>
              <Input
                name="material"
                value={form.material}
                onChange={handleChange}
                placeholder="e.g. Pure Silk, Cotton Blend"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Fabric Weight
              </label>
              <Input
                name="fabricWeight"
                value={form.fabricWeight}
                onChange={handleChange}
                placeholder="e.g. 800g, Lightweight"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Care Instructions
              </label>
              <Input
                name="careInstructions"
                value={form.careInstructions}
                onChange={handleChange}
                placeholder="e.g. Dry clean only"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Origin
              </label>
              <Input
                name="origin"
                value={form.origin}
                onChange={handleChange}
                placeholder="e.g. Kanchipuram, Tamil Nadu"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 5: Visibility & Status ───────────── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Visibility
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
              className="h-4 w-4 mt-0.5 rounded border-gray-300 text-[#470B49] focus:ring-[#470B49]"
            />
            <div>
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Active — visible to customers
              </label>
              <p className="text-xs text-gray-400 mt-0.5">
                Inactive products are hidden from the storefront but
                preserved in the admin panel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit Bar ───────────────────────────────── */}
      <div className="flex items-center justify-between sticky bottom-0 bg-white/80 backdrop-blur-sm border rounded-xl px-6 py-4 shadow-sm">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          {product && (
            <span className="text-xs text-gray-400">
              Changes are saved immediately
            </span>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#470B49] hover:bg-[#5a1060] gap-2 min-w-[140px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {product ? "Update Product" : "Create Product"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
