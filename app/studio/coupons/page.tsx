import { getAdminCoupons } from "@/lib/actions/coupon.actions";
import { PageHeader } from "@/components/admin/page-header";
import { CouponActions } from "@/components/admin/coupons/coupon-manager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TicketPercent, IndianRupee } from "lucide-react";

export default async function CouponsPage() {
  const coupons = await getAdminCoupons();

  return (
    <>
      <PageHeader title="Coupons" description={`${coupons.length} coupons`}>
        <CouponActions />
      </PageHeader>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min Purchase</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead className="text-center">Usage</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => {
              const now = new Date();
              const expired =
                c.validTill !== null && new Date(c.validTill) < now;
              const upcoming =
                c.validFrom !== null && new Date(c.validFrom) > now;
              return (
                <TableRow key={c.couponId}>
                  <TableCell>
                    <code className="text-sm font-semibold bg-gray-100 px-2 py-0.5 rounded">
                      {c.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      {c.discountType === "percentage" ? (
                        <>
                          <TicketPercent className="w-3.5 h-3.5 text-primary" />
                          {Number(c.discountValue)}%
                          {c.maxDiscountAmount && (
                            <span className="text-xs text-gray-400 ml-1">
                              (max ₹{Number(c.maxDiscountAmount)})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <IndianRupee className="w-3.5 h-3.5 text-primary" />
                          {Number(c.discountValue)}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {Number(c.minPurchaseAmount) > 0
                      ? `₹${Number(c.minPurchaseAmount)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {c.validFrom
                      ? new Date(c.validFrom).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })
                      : "—"}{" "}
                    →{" "}
                    {c.validTill
                      ? new Date(c.validTill).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })
                      : "∞"}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {c.usageCount}
                    {c.usageLimitTotal ? ` / ${c.usageLimitTotal}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {c.appliesToAllProducts ? "All Products" : "Restricted"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!c.isActive ? (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    ) : expired ? (
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    ) : upcoming ? (
                      <Badge className="bg-blue-100 text-blue-700 text-xs border-0">
                        Upcoming
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 text-xs border-0">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CouponActions coupon={c} />
                  </TableCell>
                </TableRow>
              );
            })}
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  No coupons yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
