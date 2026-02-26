import { getAdminOrderDetail } from "@/lib/actions/order.actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderActions } from "@/components/admin/order-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import Image from "next/image";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  if (isNaN(orderId)) notFound();

  const order = await getAdminOrderDetail(orderId);
  if (!order) notFound();

  return (
    <>
      <Link
        href="/studio/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <PageHeader
        title={`Order #${order.orderId}`}
        description={`Placed on ${new Date(order.orderDate).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}`}
      >
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
          <a
            href={`/api/invoice/${order.orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors ml-2"
          >
            <Printer className="w-3.5 h-3.5" />
            Invoice
          </a>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-base font-semibold text-gray-900">
                Order Items ({order.items?.length ?? 0})
              </h2>
            </div>
            <div className="divide-y">
              {order.items?.map((item) => (
                <div
                  key={item.orderItemId}
                  className="flex items-center gap-4 p-6"
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.variant?.images?.[0] ? (
                      <Image
                        src={item.variant.images[0].imagePath}
                        alt={item.productName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No img</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.variantColor} / {item.variantSize}
                      {item.variant?.sku && (
                        <span className="ml-2 text-gray-400">
                          SKU: {item.variant.sku}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{Number(item.pricePerUnit).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Returns */}
          {order.returns && order.returns.length > 0 && (
            <div className="rounded-xl border bg-white shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-base font-semibold text-gray-900">
                  Return Requests
                </h2>
              </div>
              <div className="divide-y">
                {order.returns.map((ret) => (
                  <div key={ret.returnId} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Return #{ret.returnId}
                      </span>
                      <StatusBadge status={ret.status} />
                    </div>
                    <p className="text-sm text-gray-600">{ret.reason}</p>
                    {ret.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {ret.description}
                      </p>
                    )}
                    {ret.refundAmount && (
                      <p className="mt-1 text-sm text-gray-500">
                        Refund: ₹
                        {Number(ret.refundAmount).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <OrderActions order={order} />
        </div>

        {/* Right Column - Customer & Financials */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Customer
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                {order.user?.name ?? "—"}
              </p>
              <p className="text-sm text-gray-500">
                {order.user?.email ?? "—"}
              </p>
              {order.user?.phoneNumber && (
                <p className="text-sm text-gray-500">
                  {order.user.phoneNumber}
                </p>
              )}
              {order.user?.userId && (
                <Link
                  href={`/studio/customers/${order.user.userId}`}
                  className="text-xs text-primary hover:underline"
                >
                  View customer profile →
                </Link>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Shipping Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-800">
                {order.shippingName}
              </p>
              <p>{order.shippingAddressLine1}</p>
              {order.shippingAddressLine2 && (
                <p>{order.shippingAddressLine2}</p>
              )}
              <p>
                {order.shippingCity}, {order.shippingState}{" "}
                {order.shippingPincode}
              </p>
              <p>{order.shippingPhone}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>
                  ₹{Number(order.subtotal).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>
                  ₹{Number(order.deliveryCharge).toLocaleString("en-IN")}
                </span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Discount {order.couponCode && `(${order.couponCode})`}
                  </span>
                  <span>
                    −₹{Number(order.discountAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>
                  ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Payment Details
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              {order.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span>Payment ID</span>
                  <span className="font-mono text-xs">
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="flex justify-between">
                  <span>Order ID</span>
                  <span className="font-mono text-xs">
                    {order.razorpayOrderId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="rounded-xl border bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Tracking
              </h3>
              <p className="text-sm font-mono text-gray-700">
                {order.trackingNumber}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
