"use client";

import { useState } from "react";
import { submitReturnRequest } from "@/lib/actions/return-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ReturnRequestFormProps {
  orderId: number;
  item: {
    orderItemId: number;
    productName: string;
    variantColor: string;
    variantSize: string;
    pricePerUnit: string;
    quantity: number;
  };
  hasExistingRequest: boolean;
}

const returnReasons = [
  "Wrong item received",
  "Item damaged/defective",
  "Size doesn't fit",
  "Colour different from listing",
  "Quality not as expected",
  "Changed my mind",
  "Other",
];

export function ReturnRequestForm({
  orderId,
  item,
  hasExistingRequest,
}: ReturnRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (hasExistingRequest) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Return requested
      </span>
    );
  }

  async function handleSubmit() {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("orderId", orderId.toString());
    formData.set("orderItemId", item.orderItemId.toString());
    formData.set("reason", reason);
    if (description) formData.set("description", description);

    const result = await submitReturnRequest(formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Return request submitted successfully");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
          <RotateCcw className="h-3 w-3" />
          Return
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Return</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">{item.productName}</p>
            <p className="text-xs text-muted-foreground">
              {item.variantColor} / {item.variantSize} — Qty: {item.quantity}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Refund amount: ₹
              {(parseFloat(item.pricePerUnit) * item.quantity).toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Reason for return *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {returnReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional details (optional)</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !reason}
            className="w-full"
          >
            {loading ? "Submitting..." : "Submit Return Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
