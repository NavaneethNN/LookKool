"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Star,
  Ticket,
  RotateCcw,
  Settings,
  Receipt,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Truck,
  ClipboardList,
  BarChart3,
  Barcode,
  Warehouse,
  Database,
} from "lucide-react";
import { useState } from "react";
import { OrderNotificationBell } from "./order-notification-bell";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("admin" | "cashier")[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/studio", icon: LayoutDashboard, roles: ["admin"] },
  { label: "Orders", href: "/studio/orders", icon: ShoppingCart, roles: ["admin"] },
  { label: "Products", href: "/studio/products", icon: Package, roles: ["admin"] },
  { label: "Categories", href: "/studio/categories", icon: FolderTree, roles: ["admin"] },
  { label: "Customers", href: "/studio/customers", icon: Users, roles: ["admin"] },
  { label: "Reviews", href: "/studio/reviews", icon: Star, roles: ["admin"] },
  { label: "Coupons", href: "/studio/coupons", icon: Ticket, roles: ["admin"] },
  { label: "Returns", href: "/studio/returns", icon: RotateCcw, roles: ["admin"] },
  { label: "Billing", href: "/studio/billing", icon: Receipt, roles: ["admin", "cashier"] },
  { label: "Inventory", href: "/studio/inventory", icon: Warehouse, roles: ["admin"] },
  { label: "Suppliers", href: "/studio/suppliers", icon: Truck, roles: ["admin"] },
  { label: "Purchases", href: "/studio/purchases", icon: ClipboardList, roles: ["admin"] },
  { label: "Barcode", href: "/studio/barcode", icon: Barcode, roles: ["admin", "cashier"] },
  { label: "Reports", href: "/studio/reports", icon: BarChart3, roles: ["admin"] },
  { label: "Backup", href: "/studio/backup", icon: Database, roles: ["admin"] },
  { label: "Settings", href: "/studio/settings", icon: Settings, roles: ["admin"] },
];

export function AdminSidebar({ adminEmail, role = "admin" }: { adminEmail: string; role?: "admin" | "cashier" }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/studio") return pathname === "/studio";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#1a1625] text-white transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shrink-0">
            <Store className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold tracking-tight truncate">
                LookKool Studio
              </h1>
            </div>
          )}
        </div>
        <OrderNotificationBell collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-2">
        {navItems.filter((item) => item.roles.includes(role)).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {!collapsed && (
          <div className="px-2 mb-2">
            <p className="text-xs text-gray-400 truncate">{adminEmail}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            title="Back to store"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Back to Store</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
