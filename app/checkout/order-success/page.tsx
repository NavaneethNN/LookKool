"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";

const OrderSuccessRecommendations = dynamic(
  () =>
    import("@/components/product/order-success-recommendations").then(
      (mod) => mod.OrderSuccessRecommendations
    ),
  { ssr: false }
);

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto px-4 max-w-lg">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-5">
          {/* Animated success icon */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Order Placed Successfully!</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you for shopping with LookKool.
            </p>
          </div>

          {orderId && (
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="text-lg font-bold">#{orderId}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            We&apos;ve received your order and will begin processing it shortly.
            You&apos;ll receive an email confirmation with tracking details.
          </p>

          <Separator />

          <div className="flex flex-col gap-3">
            {orderId && (
              <Button asChild>
                <Link href={`/account/orders/${orderId}`}>
                  <Package className="mr-2 h-4 w-4" />
                  View Order Details
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/account/orders">
                All My Orders
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Recommendations */}
      <div className="mt-12">
        <OrderSuccessRecommendations />
      </div>
    </div>
  );
}
