import { create } from "zustand";
import { isSoundMuted, setSoundMuted, playOrderChime, unlockAudioContext } from "@/lib/order-sound";

export interface SessionOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  wilayaName: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationState {
  orders: SessionOrder[];
  muted: boolean;
  unreadCount: number;
  addOrder: (order: Omit<SessionOrder, "isRead">) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  toggleMute: () => void;
  testChime: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  orders: [],
  muted: isSoundMuted(),
  unreadCount: 0,

  addOrder: (order) => {
    set((state) => {
      // Deduplicate by ID
      if (state.orders.some((o) => o.id === order.id)) return state;
      const newOrder: SessionOrder = { ...order, isRead: false };
      const updated = [newOrder, ...state.orders].slice(0, 20);
      return {
        orders: updated,
        unreadCount: updated.filter((o) => !o.isRead).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      orders: state.orders.map((o) => ({ ...o, isRead: true })),
      unreadCount: 0,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === id ? { ...o, isRead: true } : o
      );
      return {
        orders,
        unreadCount: orders.filter((o) => !o.isRead).length,
      };
    });
  },

  toggleMute: () => {
    const next = !get().muted;
    setSoundMuted(next);
    set({ muted: next });
  },

  testChime: async () => {
    await unlockAudioContext();
    await playOrderChime();
  },
}));
