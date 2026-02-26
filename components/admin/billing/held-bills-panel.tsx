"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HeldBill } from "./types";

// ─── Props ─────────────────────────────────────────────────────

export interface HeldBillsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heldBills: HeldBill[];
  onResumeBill: (index: number) => void;
}

// ─── Component ─────────────────────────────────────────────────

export function HeldBillsPanel({
  open,
  onOpenChange,
  heldBills,
  onResumeBill,
}: HeldBillsPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Held Bills</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {heldBills.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No held bills</p>
          ) : (
            heldBills.map((held, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {held.customer.name || "Walk-in"} · {held.cart.length} items
                  </p>
                  <p className="text-xs text-gray-500">
                    Held at {held.heldAt} · ₹{held.cart.reduce((s, c) => s + c.price * c.quantity, 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <Button size="sm" onClick={() => onResumeBill(idx)} className="bg-primary hover:bg-primary/90">
                  Resume
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
