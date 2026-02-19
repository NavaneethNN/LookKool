import {
  getDashboardStats,
  getRecentOrders,
  getRevenueChart,
} from "@/lib/actions/admin-actions";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { RevenueChart } from "@/components/admin/revenue-chart";
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Clock,
  RotateCcw,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default async function StudioDashboard() {
  const [stats, recentOrders, chartData] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(8),
    getRevenueChart(),
  ]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your store performance"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          description="From completed payments"
          trend="up"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          description={`${stats.todayOrders} today`}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
        />
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/studio/orders?status=Pending"
          className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-50">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.pendingOrders}
            </p>
            <p className="text-sm text-gray-500">Pending Orders</p>
          </div>
        </Link>
        <Link
          href="/studio/returns?status=Pending"
          className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-50">
            <RotateCcw className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.pendingReturns}
            </p>
            <p className="text-sm text-gray-500">Pending Returns</p>
          </div>
        </Link>
        <Link
          href="/studio/reviews"
          className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-50">
            <Star className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalReviews}
            </p>
            <p className="text-sm text-gray-500">Total Reviews</p>
          </div>
        </Link>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border bg-white p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
            <p className="text-sm text-gray-500">Last 30 days</p>
          </div>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <RevenueChart data={chartData} />
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Orders
          </h2>
          <Link
            href="/studio/orders"
            className="text-sm text-[#470B49] hover:underline font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/studio/orders/${order.orderId}`}
                      className="text-sm font-medium text-[#470B49] hover:underline"
                    >
                      #{order.orderId}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {new Date(order.orderDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">
                      {order.user?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.user?.email ?? "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
