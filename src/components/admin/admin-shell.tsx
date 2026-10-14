"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  TicketPercent,
  Users,
  Truck,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  Star,
  PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";
import AdminOrderNotifier from "@/components/admin/admin-order-notifier";
import NotificationBell from "@/components/admin/notification-bell";
import DashboardThemeToggle from "@/components/admin/dashboard-theme-toggle";
import InstallAppButton from "@/components/admin/install-app-button";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, section: "overview" },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingCart, section: "orders" },
  { href: "/admin/products", label: "Produits", icon: Package, section: "products" },
  { href: "/admin/categories", label: "Catégories", icon: FolderTree, section: "categories" },
  { href: "/admin/reviews", label: "Avis clients", icon: Star, section: "reviews" },
  { href: "/admin/blocked-phones", label: "Numéros bloqués", icon: PhoneOff, section: "blocked" },
  { href: "/admin/promo-codes", label: "Codes promo", icon: TicketPercent, section: "promo" },
  { href: "/admin/team", label: "Équipe", icon: Users, section: "team" },
  { href: "/admin/shipping", label: "Livraison (transporteur)", icon: Truck, section: "shipping" },
  { href: "/admin/pixel", label: "Meta Pixel", icon: Activity, section: "pixel" },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, section: "settings" },
];

export default function AdminShell({
  session,
  allowedSections,
  children,
}: {
  session: SessionPayload;
  allowedSections: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const nav = NAV.filter((item) => allowedSections.includes(item.section));

  const initials = session.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      <AdminOrderNotifier />
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="hidden lg:flex flex-col w-72 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] fixed inset-y-0 z-40">
        <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/crystal-beauty-logo.jpg" alt="Crystal Beauty" className="h-8 w-8 rounded-lg object-contain border border-white/20 bg-white/5 shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-base font-semibold leading-none truncate">Crystal Beauty</p>
              <p className="text-[11px] text-white/50 mt-1">Tableau de bord</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell />
            <DashboardThemeToggle />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
                    : "text-white/70 hover:text-white hover:bg-[var(--sidebar-accent)]"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-1.5 border-t border-[var(--sidebar-border)] pt-4">
          <InstallAppButton className="w-full justify-center" />
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-[var(--sidebar-accent)] transition-colors"
          >
            <ExternalLink className="h-4.5 w-4.5" />
            View Store
          </Link>
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="h-9 w-9 rounded-full bg-white/15 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initials || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{session.name}</p>
              <p className="text-[11px] text-white/50">{session.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors"
              aria-label="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Mobile header ===== */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-[var(--sidebar)] text-white z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/crystal-beauty-logo.jpg" alt="Crystal Beauty" className="h-6 w-6 rounded-md object-contain border border-white/20" />
          <span className="font-display font-semibold text-sm">Crystal Beauty</span>
        </div>
        <div className="flex items-center gap-1">
          <InstallAppButton />
          <NotificationBell />
          <DashboardThemeToggle />
          <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="p-2 ml-0.5">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 pt-14 bg-black/40" onClick={() => setOpen(false)}>
          <nav className="bg-[var(--sidebar)] p-3 space-y-1 max-h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium",
                  pathname === item.href ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]" : "text-white/70"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/70"
            >
              <LogOut className="h-4.5 w-4.5" /> Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* ===== Content ===== */}
      <div className="flex-1 lg:ml-72 pt-14 lg:pt-0 min-w-0">
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
