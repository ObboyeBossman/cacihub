import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalises cover image URLs for display.
 *
 * - http(s)://, blob:, data: URLs: returned as-is
 * - /api/image proxy URLs: returned as-is
 * - Relative R2 keys (e.g. sermon-covers/..., series-covers/...): routed through /api/image?key=
 */
export function normaliseCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/api/image")) {
    return trimmed;
  }

  const cleanKey = trimmed.replace(/^\//, "");
  return `/api/image?key=${encodeURIComponent(cleanKey)}`;
}
