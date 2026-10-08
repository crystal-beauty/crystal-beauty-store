"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPixel } from "@/lib/pixel";

/** Fires a Meta Pixel PageView on every client-side navigation (dedup with the initial script hit). */
export default function PixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return; // base script already fired the first PageView
    }
    trackPixel("PageView");
  }, [pathname, searchParams]);

  return null;
}
