"use client";

import { createContext, useContext } from "react";
import type { StoreSettings } from "@/lib/settings";

const SettingsContext = createContext<StoreSettings | null>(null);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings(): StoreSettings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
