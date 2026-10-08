import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

/** Server-side: read the language cookie (default FR). */
export async function getLang(): Promise<Lang> {
  try {
    const store = await cookies();
    return store.get("lang")?.value === "ar" ? "ar" : "fr";
  } catch {
    return "fr";
  }
}
