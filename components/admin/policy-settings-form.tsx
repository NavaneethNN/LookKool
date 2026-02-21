"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Save,
  ShieldCheck,
  Banknote,
  RotateCcw,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { savePolicySettings } from "@/lib/actions/admin-actions";

export type PolicySettingsData = {
  returnPolicy: string;
  returnWindowDays: number;
  cancellationPolicy: string;
  codEnabled: boolean;
  autoRefundEnabled: boolean;
};

export function PolicySettingsForm({
  settings,
}: {
  settings: PolicySettingsData;
}) {
  const [saving, setSaving] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState(settings.returnPolicy);
  const [returnWindowDays, setReturnWindowDays] = useState(settings.returnWindowDays);
  const [cancellationPolicy, setCancellationPolicy] = useState(settings.cancellationPolicy);
  const [codEnabled, setCodEnabled] = useState(settings.codEnabled);
  const [autoRefundEnabled, setAutoRefundEnabled] = useState(settings.autoRefundEnabled);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await savePolicySettings({
        returnPolicy,
        returnWindowDays,
        cancellationPolicy,
        codEnabled,
        autoRefundEnabled,
      });
      if (result.success) {
        toast.success("Policy settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      {/* Return Policy */}
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Return Policy</h3>
        </div>
        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Accept Returns?</Label>
            <Select value={returnPolicy} onValueChange={setReturnPolicy}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accept">
                  Yes — Accept returns within the return window
                </SelectItem>
                <SelectItem value="no_returns">
                  No — Do not accept any returns
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When set to &quot;No&quot;, customers will not see the return option on their orders.
            </p>
          </div>

          {returnPolicy === "accept" && (
            <div className="space-y-2">
              <Label>Return Window (days after delivery)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={returnWindowDays}
                onChange={(e) => setReturnWindowDays(parseInt(e.target.value) || 7)}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Customers can request a return within this many days after their order is delivered.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Cancellation Policy</h3>
        </div>
        <Separator />

        <div className="space-y-2">
          <Label>When can customers cancel orders?</Label>
          <Select value={cancellationPolicy} onValueChange={setCancellationPolicy}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anytime">
                Anytime before delivery
              </SelectItem>
              <SelectItem value="before_shipment">
                Only before the order is shipped
              </SelectItem>
              <SelectItem value="no_cancellation">
                Cancellation not allowed
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This controls whether the &quot;Cancel Order&quot; button appears on the customer&apos;s order detail page.
          </p>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Payment Settings</h3>
        </div>
        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Cash on Delivery (COD)</Label>
            <p className="text-xs text-muted-foreground">
              Allow customers to pay when they receive their order.
            </p>
          </div>
          <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
        </div>
      </div>

      {/* Refund Settings */}
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Automated Refunds</h3>
        </div>
        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-refund via Razorpay</Label>
            <p className="text-xs text-muted-foreground">
              When a return is approved and marked as &quot;Refunded&quot;, automatically process
              the refund through Razorpay. Only applies to online-paid orders.
            </p>
          </div>
          <Switch checked={autoRefundEnabled} onCheckedChange={setAutoRefundEnabled} />
        </div>

        {!autoRefundEnabled && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
              With auto-refund disabled, you&apos;ll need to manually process refunds from the Razorpay dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Policies
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
