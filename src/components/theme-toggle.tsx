"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CACI Hub — Theme Toggle
 * A segmented control with three options: Light, Dark, System.
 * Renders a skeleton placeholder until mounted to avoid hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-lg bg-n50 border border-n100 h-10">
        <div className="h-7 w-16 rounded-md skeleton-caci" />
        <div className="h-7 w-16 rounded-md skeleton-caci" />
        <div className="h-7 w-16 rounded-md skeleton-caci" />
      </div>
    );
  }

  const options: { key: "light" | "dark" | "system"; label: string; icon: React.ReactNode }[] = [
    { key: "light", label: "Light", icon: <Sun size={15} /> },
    { key: "dark", label: "Dark", icon: <Moon size={15} /> },
    { key: "system", label: "Auto", icon: <Monitor size={15} /> },
  ];

  const active = theme || "system";

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="inline-flex items-center gap-1 p-1 rounded-lg bg-n50 border border-n100"
    >
      {options.map((opt) => {
        const isActive = active === opt.key;
        return (
          <button
            key={opt.key}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.key)}
            className={cn(
              "inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[13px] font-medium transition-all",
              isActive
                ? "bg-white text-caci-blue shadow-sm"
                : "text-n500 hover:text-n700",
            )}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
