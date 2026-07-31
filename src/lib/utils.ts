import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts legacy pub-*.r2.dev public URLs (which require public bucket access
 * that is not enabled on the caci-warm-prod bucket) into internal
 * /api/image?key=<key> proxy URLs that use service credentials.
 *
 * Leaves all other URLs (https://, /api/image, blob:, relative) unchanged.
 */
export function normaliseCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Match: https://pub-<hash>.r2.dev/<key>
  const r2Match = url.match(/^https?:\/\/pub-[^/]+\.r2\.dev\/(.+)$/);
  if (r2Match) {
    return `/api/image?key=${encodeURIComponent(r2Match[1])}`;
  }
  return url;
}
