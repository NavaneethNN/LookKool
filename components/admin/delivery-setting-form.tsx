"use client";

import { useState } from "react";
import { upsertDeliverySetting } from "@/lib/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Setting = {
  settingId: number;
  label: string;
  minOrderAmount: string;
  deliveryCharge: string;
  isFreeDelivery: boolean;
  stateCode: string | null;
  isActive: boolean;
  [key: string]: unknown;
};

export function DeliverySettingForm({ setting }: { setting?: Setting }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const isEdit = !!setting;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const data = {
      label: fd.get("label") as string,
      minOrderAmount: fd.get("minOrderAmount") as string,
      deliveryCharge: fd.get("deliveryCharge") as string,
      isFreeDelivery: fd.get("isFreeDelivery") === "true",
      stateCode: (fd.get("stateCode") as string) || undefined,
      isActive: fd.get("isActive") === "true",
    };

    try {
      await upsertDeliverySetting({
        ...(isEdit ? { settingId: setting.settingId } : {}),
        ...data,
      });
      toast.success(isEdit ? "Setting updated" : "Setting created");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save setting");
    }
    setLoading(false);
  }

  // For table row edit button
  if (isEdit && !showForm) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowForm(true)}
        title="Edit rule"
      >
        <Pencil className="w-4 h-4" />
      </Button>
    );
  }

  // Inline form for both create & edit
  if (!isEdit && !showForm) {
    return (
      <Button
        size="sm"
        onClick={() => setShowForm(true)}
        className="bg-primary hover:bg-primary/90"
      >
        <Plus className="w-4 h-4 mr-1" /> Add Rule
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <Label>Label *</Label>
          <Input
            name="label"
            required
            defaultValue={setting?.label ?? ""}
            placeholder="e.g. Standard Delivery"
          />
        </div>
        <div>
          <Label>Min Order Amount</Label>
          <Input
            name="minOrderAmount"
            type="number"
            step="0.01"
            defaultValue={setting?.minOrderAmount ?? "0"}
          />
        </div>
        <div>
          <Label>Delivery Charge</Label>
          <Input
            name="deliveryCharge"
            type="number"
            step="0.01"
            defaultValue={setting?.deliveryCharge ?? "0"}
          />
        </div>
        <div>
          <Label>Free Delivery?</Label>
          <Select
            name="isFreeDelivery"
            defaultValue={setting?.isFreeDelivery ? "true" : "false"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>State Code</Label>
          <Input
            name="stateCode"
            defaultValue={setting?.stateCode ?? ""}
            placeholder="All states"
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            name="isActive"
            defaultValue={setting?.isActive !== false ? "true" : "false"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
          size="sm"
        >
          {loading ? "Saving..." : isEdit ? "Update" : "Create Rule"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
