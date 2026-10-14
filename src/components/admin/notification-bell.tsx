"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Volume2, VolumeX, Play, CheckCheck, ExternalLink } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useNotificationStore } from "@/lib/order-notifications";
import { cn } from "@/lib/utils";

export default function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { orders, unreadCount, muted, toggleMute, testChime, markAllAsRead, markAsRead } =
    useNotificationStore();

  const [notificationsSupported] = useState(() => {
    return typeof window !== "undefined" && "Notification" in window;
  });
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  async function requestNotificationPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
      } catch (e) {
        console.warn("Failed to request notification permission:", e);
      }
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) {
            markAllAsRead();
          }
        }}
        className="relative p-2 rounded-xl text-white/70 hover:text-white hover:bg-[var(--sidebar-accent)] transition-colors"
        title="Notifications de commandes"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-100 z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} nouvelle(s)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMute}
                className={cn(
                  "p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1",
                  muted
                    ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                )}
                title={muted ? "Son désactivé (cliquer pour activer)" : "Son activé (cliquer pour couper)"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={testChime}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                title="Tester le son du carillon"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* System notification permission bar */}
          {notificationsSupported && permission !== "granted" && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
              <span>Activer les alertes sur cet appareil</span>
              <button
                onClick={requestNotificationPermission}
                className="font-semibold text-blue-700 underline hover:text-blue-900"
              >
                Activer
              </button>
            </div>
          )}

          {/* Orders list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Aucune nouvelle commande dans cette session.</p>
              </div>
            ) : (
              orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  onClick={() => {
                    markAsRead(o.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block px-4 py-3 hover:bg-slate-50 transition-colors",
                    !o.isRead && "bg-blue-50/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {o.orderNumber} · {o.customerName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {o.wilayaName} · {formatMoney(o.total)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(o.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {orders.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tout marquer comme lu
              </button>
              <Link
                href="/admin/orders"
                onClick={() => setOpen(false)}
                className="font-medium text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                Toutes les commandes <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
