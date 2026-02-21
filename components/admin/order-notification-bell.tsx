"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, Package, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useOrderNotifications,
} from "@/lib/hooks/use-order-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function OrderNotificationBell({ collapsed }: { collapsed: boolean }) {
  const { notifications, unreadCount, markAllRead, markAsRead, clearAll } =
    useOrderNotifications();
  const prevCountRef = useRef(0);

  // Show toast for each new notification
  useEffect(() => {
    if (unreadCount > prevCountRef.current && notifications.length > 0) {
      const latest = notifications[0];
      toast.info(`New Order #${latest.orderId}`, {
        description: `${latest.customerName} — ${formatCurrency(latest.totalAmount)} (${latest.paymentMethod.toUpperCase()})`,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = `/studio/orders/${latest.orderId}`;
          },
        },
      });
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Order notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? "right" : "bottom"}
        align="start"
        className="w-80 max-h-[420px] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllRead();
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
                title="Mark all read"
              >
                <Check className="w-3 h-3" />
                Read all
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No new orders yet
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} asChild className="p-0">
              <Link
                href={`/studio/orders/${n.orderId}`}
                onClick={() => markAsRead(n.id)}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 cursor-pointer w-full",
                  !n.read && "bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                    !n.read
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      Order #{n.orderId}
                    </span>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(n.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {n.customerName} — {formatCurrency(n.totalAmount)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
                      {n.paymentMethod}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
