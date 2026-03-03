import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  CreditCard,
  Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAuthOrRedirect } from "@/lib/auth-helpers";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ReturnRequestForm } from "@/components/orders/return-request-form";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { getReturnRequestsForOrder } from "@/lib/actions/return.actions";
import { getPublicSiteConfig } from "@/lib/site-config";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id}`,
  };
}

const statusSteps = [
  { key: "Pending", label: "Pending", icon: Clock },
  { key: "Processing", label: "Processing", icon: Package },
  { key: "Packed", label: "Packed", icon: Package },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

const statusColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Processing: "bg-blue-100 text-blue-800",
  Packed: "bg-indigo-100 text-indigo-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Refunded: "bg-gray-100 text-gray-800",
};

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await requireAuthOrRedirect();
  const user = session.user;

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) notFound();

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.orderId, orderId), eq(orders.userId, user.id)),
    with: {
      items: {
        with: {
          product: true,
          variant: {
            with: {
              images: true,
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  // Fetch existing return requests for this order
  let existingReturns: { orderItemId: number }[] = [];
  try {
    existingReturns = await getReturnRequestsForOrder(orderId);
  } catch {
    // ignore if user not authenticated somehow
  }
  const returnedItemIds = new Set(existingReturns.map((r) => r.orderItemId));

  // Fetch policy settings
  const siteConfig = await getPublicSiteConfig();
  const returnsAccepted = siteConfig.returnPolicy === "accept";
  const cancellationPolicy = siteConfig.cancellationPolicy;

  // Determine if cancel button should show
  const terminalStatuses = ["Delivered", "Cancelled", "Refunded"];
  const canCancel =
    cancellationPolicy !== "no_cancellation" &&
    !terminalStatuses.includes(order.status) &&
    (cancellationPolicy === "anytime" || order.status !== "Shipped");

  const isCancelled = order.status === "Cancelled" || order.status === "Refunded";
  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Order #{order.orderId}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on{" "}
            {new Date(order.orderDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCancel && <CancelOrderButton orderId={order.orderId} />}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              statusColor[order.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Progress */}
      {!isCancelled && (
        <Card className="mb-6">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div
                          className={`h-0.5 flex-1 ${
                            isCompleted ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 ${
                            i < currentStepIndex ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-0.5">
            <p className="font-medium">{order.shippingName}</p>
            <p className="text-muted-foreground">{order.shippingAddressLine1}</p>
            {order.shippingAddressLine2 && (
              <p className="text-muted-foreground">{order.shippingAddressLine2}</p>
            )}
            <p className="text-muted-foreground">
              {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
            </p>
            <p className="text-muted-foreground">{order.shippingPhone}</p>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {order.paymentMethod === "cod" ? (
                <Banknote className="h-4 w-4 text-primary" />
              ) : (
                <CreditCard className="h-4 w-4 text-primary" />
              )}
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant={order.paymentStatus === "Completed" ? "default" : "secondary"}
              >
                {order.paymentStatus}
              </Badge>
            </div>
            {order.razorpayPaymentId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{order.razorpayPaymentId}</span>
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tracking #</span>
                <span className="font-mono text-xs">{order.trackingNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" />
            Items ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => {
            const primaryImage = item.variant?.images?.find(
              (img: { isPrimary: boolean }) => img.isPrimary
            );
            const firstImage = item.variant?.images?.[0];
            const imageSrc = primaryImage?.imagePath || firstImage?.imagePath;

            return (
              <div key={item.orderItemId} className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product?.slug || ""}`}
                    className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.variantColor} / {item.variantSize}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} × ₹
                    {parseFloat(item.pricePerUnit).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-sm font-bold whitespace-nowrap">
                  ₹
                  {(
                    parseFloat(item.pricePerUnit) * item.quantity
                  ).toLocaleString("en-IN")}
                </span>
                {order.status === "Delivered" && returnsAccepted && (
                  <ReturnRequestForm
                    orderId={order.orderId}
                    item={{
                      orderItemId: item.orderItemId,
                      productName: item.productName,
                      variantColor: item.variantColor,
                      variantSize: item.variantSize,
                      pricePerUnit: item.pricePerUnit,
                      quantity: item.quantity,
                    }}
                    hasExistingRequest={returnedItemIds.has(item.orderItemId)}
                  />
                )}
              </div>
            );
          })}

          <Separator />

          {/* Order totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{parseFloat(order.subtotal).toLocaleString("en-IN")}</span>
            </div>
            {parseFloat(order.deliveryCharge) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>
                  ₹{parseFloat(order.deliveryCharge).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {parseFloat(order.deliveryCharge) === 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-700 font-medium">FREE</span>
              </div>
            )}
            {parseFloat(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-700">
                <span>
                  Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                </span>
                <span>
                  -₹{parseFloat(order.discountAmount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{parseFloat(order.totalAmount).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
