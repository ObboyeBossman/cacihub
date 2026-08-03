"use client";

import { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * CACI Hub — Theme Provider
 * Wraps next-themes with class-based dark mode (matches the `.dark` selector
 * already defined in globals.css). Persists to localStorage under the key
 * "caci-theme" and respects the user's OS preference on first visit.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="caci-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
