"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatMoney } from "@/lib/format";
import { initAudioUnlockListeners, playOrderChime } from "@/lib/order-sound";
import { useNotificationStore } from "@/lib/order-notifications";

interface FetchedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  wilayaName: string;
  createdAt: string;
}

export default function AdminOrderNotifier() {
  const router = useRouter();
  const addOrder = useNotificationStore((s) => s.addOrder);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    initAudioUnlockListeners();

    let isMounted = true;

    async function checkNewOrders() {
      try {
        const res = await fetch("/api/admin/orders?limit=10", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) return;
        const data = await res.json();
        const orders: FetchedOrder[] = data.orders || [];

        // On first run, record all existing order IDs to avoid alert flood
        if (!initialFetchDoneRef.current) {
          orders.forEach((o) => seenIdsRef.current.add(o.id));
          initialFetchDoneRef.current = true;
          return;
        }

        // Subsequent polls: check for genuinely new orders created in this session
        const newOrders: FetchedOrder[] = [];
        for (const order of orders) {
          if (!seenIdsRef.current.has(order.id)) {
            seenIdsRef.current.add(order.id);
            const createdAtTime = new Date(order.createdAt).getTime();
            // Anti-flood: must be created after session started
            if (createdAtTime >= sessionStartRef.current - 5000) {
              newOrders.push(order);
            }
          }
        }

        if (newOrders.length > 0 && isMounted) {
          // Play audio chime
          await playOrderChime();

          // Live router refresh so tables and counters update without page reload
          router.refresh();

          for (const order of newOrders) {
            addOrder({
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              total: order.total,
              wilayaName: order.wilayaName,
              createdAt: order.createdAt,
            });

            toast.success(`Nouvelle commande : ${order.orderNumber}`, {
              description: `${order.customerName} (${order.wilayaName}) — ${formatMoney(order.total)}`,
              action: {
                label: "Voir",
                onClick: () => router.push(`/admin/orders/${order.id}`),
              },
              duration: 8000,
            });

            // Native PWA/Browser Notification if granted
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted" &&
              "serviceWorker" in navigator
            ) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification("Nouvelle Commande Crystal Beauty !", {
                  body: `${order.orderNumber} · ${order.customerName} — ${formatMoney(order.total)}`,
                  icon: "/crystal-beauty-logo.jpg",
                  badge: "/crystal-beauty-logo.jpg",
                  tag: order.id,
                });
              });
            }
          }
        }
      } catch (err) {
        console.debug("Silent order polling error:", err);
      }
    }

    // Initial establish baseline
    checkNewOrders();

    // Poll every 15 seconds
    const interval = setInterval(checkNewOrders, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router, addOrder]);

  return null;
}
