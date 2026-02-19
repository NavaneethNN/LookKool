"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
} from "@/lib/actions/admin-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { toast } from "sonner";

type Coupon = {
  couponId: number;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  minPurchaseAmount: string;
  maxDiscountAmount: string | null;
  validFrom: Date | null;
  validTill: Date | null;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  appliesToAllProducts: boolean;
  isActive: boolean;
  [key: string]: unknown;
};

function toDateInput(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 16);
}

export function CouponActions({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!coupon;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const data = {
      code: fd.get("code") as string,
      description: (fd.get("description") as string) || undefined,
      discountType: fd.get("discountType") as "percentage" | "fixed_amount",
      discountValue: fd.get("discountValue") as string,
      minPurchaseAmount: (fd.get("minPurchaseAmount") as string) || "0",
      maxDiscountAmount: (fd.get("maxDiscountAmount") as string) || undefined,
      validFrom: fd.get("validFrom")
        ? (fd.get("validFrom") as string)
        : undefined,
      validTill: fd.get("validTill")
        ? (fd.get("validTill") as string)
        : undefined,
      usageLimitTotal: fd.get("usageLimitTotal")
        ? Number(fd.get("usageLimitTotal"))
        : undefined,
      usageLimitPerCustomer: fd.get("usageLimitPerCustomer")
        ? Number(fd.get("usageLimitPerCustomer"))
        : undefined,
      appliesToAllProducts: fd.get("scope") === "all",
      isActive: true,
    };

    try {
      if (isEdit) {
        await updateCoupon(coupon.couponId, data);
        toast.success("Coupon updated");
      } else {
        await createCoupon(data);
        toast.success("Coupon created");
      }
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!coupon || !confirm("Delete this coupon permanently?")) return;
    setLoading(true);
    try {
      await deleteCoupon(coupon.couponId);
      toast.success("Coupon deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete coupon");
    }
    setLoading(false);
  }

  async function handleToggle() {
    if (!coupon) return;
    setLoading(true);
    try {
      await toggleCouponActive(coupon.couponId, !coupon.isActive);
      toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
      router.refresh();
    } catch {
      toast.error("Failed to toggle coupon");
    }
    setLoading(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-1">
          <DialogTrigger asChild>
            {isEdit ? (
              <Button variant="ghost" size="icon" title="Edit coupon">
                <Pencil className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" className="bg-[#470B49] hover:bg-[#5a1260]">
                <Plus className="w-4 h-4 mr-1" /> Add Coupon
              </Button>
            )}
          </DialogTrigger>
          {isEdit && (
            <>
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={handleToggle}
                title={coupon.isActive ? "Deactivate" : "Activate"}
              >
                <Power
                  className={`w-4 h-4 ${
                    coupon.isActive ? "text-green-600" : "text-gray-400"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={handleDelete}
                title="Delete coupon"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  name="code"
                  required
                  defaultValue={coupon?.code}
                  placeholder="SUMMER20"
                  className="uppercase"
                />
              </div>
              <div>
                <Label>Discount Type *</Label>
                <Select
                  name="discountType"
                  defaultValue={coupon?.discountType ?? "percentage"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                name="description"
                defaultValue={coupon?.description ?? ""}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Discount Value *</Label>
                <Input
                  name="discountValue"
                  required
                  type="number"
                  step="0.01"
                  defaultValue={coupon?.discountValue ?? ""}
                />
              </div>
              <div>
                <Label>Min Purchase</Label>
                <Input
                  name="minPurchaseAmount"
                  type="number"
                  step="0.01"
                  defaultValue={coupon?.minPurchaseAmount ?? "0"}
                />
              </div>
              <div>
                <Label>Max Discount</Label>
                <Input
                  name="maxDiscountAmount"
                  type="number"
                  step="0.01"
                  defaultValue={coupon?.maxDiscountAmount ?? ""}
                  placeholder="No cap"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid From</Label>
                <Input
                  name="validFrom"
                  type="datetime-local"
                  defaultValue={toDateInput(coupon?.validFrom ?? null)}
                />
              </div>
              <div>
                <Label>Valid Till</Label>
                <Input
                  name="validTill"
                  type="datetime-local"
                  defaultValue={toDateInput(coupon?.validTill ?? null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Usage Limit</Label>
                <Input
                  name="usageLimitTotal"
                  type="number"
                  defaultValue={coupon?.usageLimitTotal ?? ""}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label>Per Customer Limit</Label>
                <Input
                  name="usageLimitPerCustomer"
                  type="number"
                  defaultValue={coupon?.usageLimitPerCustomer ?? ""}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div>
              <Label>Scope</Label>
              <Select
                name="scope"
                defaultValue={coupon?.appliesToAllProducts !== false ? "all" : "restricted"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="restricted">Specific Products / Categories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#470B49] hover:bg-[#5a1260]"
              >
                {loading
                  ? "Saving..."
                  : isEdit
                  ? "Update Coupon"
                  : "Create Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
