"use client";

import { useState } from "react";
import {
  updateOrderStatus,
  updatePaymentStatus,
  updateTrackingNumber,
  updateOrderNotes,
} from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const orderStatuses = [
  "Pending",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

const paymentStatuses = ["Pending", "Completed", "Failed", "Refunded"];

interface OrderActionsProps {
  order: {
    orderId: number;
    status: string;
    paymentStatus: string;
    trackingNumber: string | null;
    notes: string | null;
  };
}

export function OrderActions({ order }: OrderActionsProps) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatusUpdate() {
    setLoading("status");
    try {
      await updateOrderStatus(order.orderId, status);
      toast.success("Order status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order status");
    }
    setLoading(null);
  }

  async function handlePaymentStatusUpdate() {
    setLoading("payment");
    try {
      await updatePaymentStatus(order.orderId, paymentStatus);
      toast.success("Payment status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update payment status");
    }
    setLoading(null);
  }

  async function handleTrackingUpdate() {
    setLoading("tracking");
    try {
      await updateTrackingNumber(order.orderId, tracking);
      toast.success("Tracking number updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update tracking number");
    }
    setLoading(null);
  }

  async function handleNotesUpdate() {
    setLoading("notes");
    try {
      await updateOrderNotes(order.orderId, notes);
      toast.success("Notes updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update notes");
    }
    setLoading(null);
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
      <h2 className="text-base font-semibold text-gray-900">
        Manage Order
      </h2>

      {/* Order Status */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Order Status
        </label>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {orderStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button
            onClick={handleStatusUpdate}
            disabled={loading === "status" || status === order.status}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {loading === "status" ? "Saving..." : "Update"}
          </Button>
        </div>
      </div>

      {/* Payment Status */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Payment Status
        </label>
        <div className="flex gap-2">
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button
            onClick={handlePaymentStatusUpdate}
            disabled={
              loading === "payment" || paymentStatus === order.paymentStatus
            }
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {loading === "payment" ? "Saving..." : "Update"}
          </Button>
        </div>
      </div>

      {/* Tracking Number */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Tracking Number
        </label>
        <div className="flex gap-2">
          <Input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Enter tracking number"
          />
          <Button
            onClick={handleTrackingUpdate}
            disabled={loading === "tracking"}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {loading === "tracking" ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Admin Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes about this order..."
          rows={3}
        />
        <Button
          onClick={handleNotesUpdate}
          disabled={loading === "notes"}
          size="sm"
          className="mt-2 bg-primary hover:bg-primary/90"
        >
          {loading === "notes" ? "Saving..." : "Save Notes"}
        </Button>
      </div>
    </div>
  );
}
