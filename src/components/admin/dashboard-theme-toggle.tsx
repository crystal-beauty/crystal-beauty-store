"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "crystal_beauty_dashboard_theme";

function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;

  // Strict guard: only allow dark mode if in admin context
  const isAdmin =
    window.location.search.includes("admin") ||
    window.location.pathname.startsWith("/admin");

  if (!isAdmin) {
    document.documentElement.classList.remove("dark");
    return;
  }

  let isDark = false;
  if (mode === "dark") {
    isDark = true;
  } else if (mode === "light") {
    isDark = false;
  } else {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export default function DashboardThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved;
      }
    } catch {}
    return "system";
  });

  useEffect(() => {
    applyTheme(theme);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      try {
        const current = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "system";
        if (current === "system") {
          applyTheme("system");
        }
      } catch {}
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  function cycleTheme() {
    const next: ThemeMode = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl text-white/70 hover:text-white hover:bg-[var(--sidebar-accent)] transition-colors text-xs font-medium",
        className
      )}
      title={`Thème actuel : ${theme} (Cliquer pour changer)`}
      aria-label="Changer le thème du tableau de bord"
    >
      {theme === "dark" && <Moon className="h-4 w-4 text-blue-300" />}
      {theme === "light" && <Sun className="h-4 w-4 text-amber-300" />}
      {theme === "system" && <Monitor className="h-4 w-4 text-white/80" />}
      <span className="capitalize hidden sm:inline">{theme}</span>
    </button>
  );
}
