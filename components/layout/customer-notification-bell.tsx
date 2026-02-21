"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { Bell, Check, Package, Tag, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notification-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const typeIcons = {
  order: Package,
  offer: Tag,
  system: Info,
};

interface Notification {
  notificationId: number;
  type: "order" | "offer" | "system";
  title: string;
  message: string;
  data: unknown;
  isRead: boolean;
  createdAt: Date;
}

export function CustomerNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [, startTransition] = useTransition();

  const loadNotifications = useCallback(() => {
    startTransition(async () => {
      try {
        const [result, count] = await Promise.all([
          getMyNotifications({ limit: 10 }),
          getUnreadNotificationCount(),
        ]);
        setNotifications(result.notifications as unknown as Notification[]);
        setUnreadCount(count);
      } catch {
        // user might not be logged in
      }
    });
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === id ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getNotificationHref = (n: Notification): string => {
    const d = n.data as Record<string, unknown> | null;
    if (n.type === "order" && d?.orderId) {
      return `/account/orders`;
    }
    return "/account";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAllRead();
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.type] || Info;
            return (
              <DropdownMenuItem key={n.notificationId} asChild className="p-0">
                <Link
                  href={getNotificationHref(n)}
                  onClick={() => {
                    if (!n.isRead) handleMarkRead(n.notificationId);
                  }}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 cursor-pointer w-full",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                      !n.isRead
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm truncate", !n.isRead && "font-medium")}>
                        {n.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Link
                href="/account"
                className="text-xs text-primary hover:underline"
              >
                View all notifications
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
