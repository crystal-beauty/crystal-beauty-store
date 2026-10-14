"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  showIconFallback?: boolean;
}

const DEFAULT_FALLBACK = "/crystal-beauty-logo.jpg";

export default function ProductImage({
  src,
  alt = "",
  className,
  fallbackSrc = DEFAULT_FALLBACK,
  showIconFallback = true,
  ...props
}: ProductImageProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  // Synchronously reset error flags if src prop changes
  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(false);
    setFallbackFailed(false);
  }

  function handleError() {
    if (!hasError) {
      setHasError(true);
      if (!fallbackSrc || fallbackSrc === src) {
        setFallbackFailed(true);
      }
    } else {
      setFallbackFailed(true);
    }
  }

  const currentSrc = hasError
    ? fallbackFailed
      ? undefined
      : fallbackSrc
    : src;

  if (!currentSrc || fallbackFailed) {
    if (showIconFallback) {
      return (
        <div
          className={cn(
            "h-full w-full flex items-center justify-center bg-muted/60 text-[var(--primary)]/30",
            className
          )}
          aria-label={alt || "Image indisponible"}
        >
          <Package className="h-8 w-8 stroke-1" />
        </div>
      );
    }
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}
