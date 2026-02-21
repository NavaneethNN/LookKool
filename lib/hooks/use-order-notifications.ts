"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface OrderNotification {
  id: number;
  orderId: number;
  customerName: string;
  totalAmount: string;
  paymentMethod: string;
  status: string;
  timestamp: Date;
  read: boolean;
}

export function useOrderNotifications() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to INSERT events on the orders table
    const channel = supabase
      .channel("admin-order-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as Record<string, unknown>;
          const notification: OrderNotification = {
            id: Date.now(),
            orderId: newOrder.order_id as number,
            customerName: (newOrder.shipping_name as string) || "Customer",
            totalAmount: (newOrder.total_amount as string) || "0.00",
            paymentMethod: (newOrder.payment_method as string) || "razorpay",
            status: (newOrder.status as string) || "Pending",
            timestamp: new Date(),
            read: false,
          };

          setNotifications((prev) => [notification, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Subscribed to order notifications");
        }
        if (status === "CHANNEL_ERROR") {
          console.error("[Realtime] Error subscribing to order notifications");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAllRead,
    markAsRead,
    clearAll,
  };
}
