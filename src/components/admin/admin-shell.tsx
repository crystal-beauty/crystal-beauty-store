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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, section: "overview" },
  { href: "/admin/products", label: "Products", icon: Package, section: "products" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, section: "categories" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, section: "orders" },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: TicketPercent, section: "promo" },
  { href: "/admin/team", label: "Team", icon: Users, section: "team" },
  { href: "/admin/shipping", label: "Shipping & World Express", icon: Truck, section: "shipping" },
  { href: "/admin/pixel", label: "Meta Pixel", icon: Activity, section: "pixel" },
  { href: "/admin/settings", label: "Store Settings", icon: Settings, section: "settings" },
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
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="hidden lg:flex flex-col w-72 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] fixed inset-y-0 z-40">
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-[var(--sidebar-border)]">
          <Sparkles className="h-6 w-6 text-[var(--gold)]" />
          <div>
            <p className="font-display text-lg font-semibold leading-none">Dashboard</p>
            <p className="text-[11px] text-white/50 mt-1">Store Management</p>
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

        <div className="px-3 pb-4 space-y-1 border-t border-[var(--sidebar-border)] pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-[var(--sidebar-accent)] transition-colors"
          >
            <ExternalLink className="h-4.5 w-4.5" />
            View Store
          </Link>
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="h-9 w-9 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center text-sm font-bold shrink-0">
              {initials || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{session.name}</p>
              <p className="text-[11px] text-white/50">{session.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Mobile header ===== */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-[var(--sidebar)] text-white z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--gold)]" />
          <span className="font-display font-semibold">Dashboard</span>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="p-2">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
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
