import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalises cover image URLs for display.
 *
 * - pub-*.r2.dev URLs: returned as-is (direct public R2 access, works on every device)
 * - Legacy /api/image proxy URLs: returned as-is (still work as a fallback)
 * - All other URLs (https://, blob:, relative): returned unchanged
 */
export function normaliseCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // pub-*.r2.dev URLs are now public — serve them directly, no proxy needed
  // (Previously these were converted to /api/image proxy URLs, but the bucket
  //  is now public so direct access works on every device including mobile.)
  return url;
}
