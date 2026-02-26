import { getAdminCustomerDetail } from "@/lib/actions/customer.actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { CustomerRoleToggle } from "@/components/admin/customer-role-toggle";
import { CustomerLoyaltyCard } from "@/components/admin/customer-loyalty-card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingCart } from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminCustomerDetail(id);
  if (!data?.customer) notFound();

  const { customer, addresses, orders } = data;

  return (
    <>
      <Link
        href="/studio/customers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      <PageHeader title={customer.name} description={customer.email}>
        <CustomerRoleToggle
          userId={customer.id}
          currentRole={customer.role}
        />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Profile
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="text-gray-900 font-medium">
                {customer.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900">{customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-900">
                {customer.phoneNumber ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="capitalize text-gray-900">{customer.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Joined</span>
              <span className="text-gray-900">
                {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
              </span>
            </div>
            {customer.lastLoginAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Last Login</span>
                <span className="text-gray-900">
                  {new Date(customer.lastLoginAt).toLocaleDateString("en-IN", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Addresses */}
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Addresses ({addresses.length})
          </h3>
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr.addressId}
                className="p-3 rounded-lg bg-gray-50 text-sm"
              >
                <p className="font-medium text-gray-800">
                  {addr.fullName}
                  {addr.isDefault && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-gray-600">{addr.addressLine1}</p>
                {addr.addressLine2 && (
                  <p className="text-gray-600">{addr.addressLine2}</p>
                )}
                <p className="text-gray-600">
                  {addr.city}, {addr.state} {addr.pincode}
                </p>
                <p className="text-gray-500">{addr.phoneNumber}</p>
              </div>
            ))}
            {addresses.length === 0 && (
              <p className="text-sm text-gray-400">No saved addresses</p>
            )}
          </div>
        </div>

        {/* Order History */}
        <div className="rounded-xl border bg-white shadow-sm p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Orders ({orders.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orders.map((order) => (
              <Link
                key={order.orderId}
                href={`/studio/orders/${order.orderId}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{order.orderId}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.orderDate).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-gray-400">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Loyalty & Credit Section */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <CustomerLoyaltyCard userId={customer.id} />
      </div>
    </>
  );
}
