"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrders } from "@/lib/actions/checkout-actions";

interface OrderItem {
  orderItemId: number;
  productName: string;
  variantColor: string;
  variantSize: string;
  quantity: number;
  pricePerUnit: string;
}

interface Order {
  orderId: number;
  orderDate: Date;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: string;
  items: OrderItem[];
}

const statusIcon: Record<string, React.ReactNode> = {
  Pending: <Clock className="h-4 w-4" />,
  Processing: <Package className="h-4 w-4" />,
  Packed: <Package className="h-4 w-4" />,
  Shipped: <Truck className="h-4 w-4" />,
  Delivered: <CheckCircle2 className="h-4 w-4" />,
  Cancelled: <XCircle className="h-4 w-4" />,
  Refunded: <XCircle className="h-4 w-4" />,
};

const statusColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Processing: "bg-blue-100 text-blue-800",
  Packed: "bg-indigo-100 text-indigo-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Refunded: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then((data) => {
      setOrders(data as unknown as Order[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Account
      </Link>

      <h1 className="text-2xl font-bold sm:text-3xl mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No orders yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your order history will appear here once you make a purchase.
            </p>
          </div>
          <Button asChild>
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              href={`/account/orders/${order.orderId}`}
              className="block rounded-xl border p-5 transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold">
                      Order #{order.orderId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColor[order.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusIcon[order.status]}
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className="font-bold">
                      ₹{parseFloat(order.totalAmount).toLocaleString("en-IN")}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {order.paymentMethod === "cod" ? "COD" : "Online"}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <Separator className="my-3" />

              <div className="text-sm text-muted-foreground">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                {order.items.length <= 3 ? (
                  <span>
                    {" — "}
                    {order.items
                      .map((i) => i.productName)
                      .join(", ")}
                  </span>
                ) : (
                  <span>
                    {" — "}
                    {order.items
                      .slice(0, 2)
                      .map((i) => i.productName)
                      .join(", ")}
                    {` +${order.items.length - 2} more`}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
