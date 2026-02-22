"use client";

import { useState } from "react";
import { resolveReturn } from "@/lib/actions/admin-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const nextStatuses: Record<string, string[]> = {
  Pending: ["Approved", "Rejected"],
  Approved: ["Refunded", "Rejected"],
};

export function ReturnResolve({
  returnId,
  currentStatus,
}: {
  returnId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  const options = nextStatuses[currentStatus];
  if (!options || options.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">
        {currentStatus === "Refunded" ? "Resolved" : "—"}
      </span>
    );
  }

  async function handleSubmit() {
    if (!status) {
      toast.error("Please select a status");
      return;
    }
    setLoading(true);
    try {
      const result = await resolveReturn(returnId, status, notes || undefined);
      toast.success(`Return updated to ${status}`);
      // Show refund result if applicable
      if (result.refundResult) {
        if (result.refundResult.success) {
          toast.success(`Razorpay refund processed (ID: ${result.refundResult.refundId})`);
        } else {
          toast.warning(`Auto-refund skipped: ${result.refundResult.reason}`);
        }
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update return");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Update return status">
          <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Return #{returnId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {options.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Admin Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this return..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={loading || !status}
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
