import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "mark";
  theme?: "light" | "dark";
}

/**
 * CACI — Sermons portal logo.
 * Uses the real /logo.png image, matching the main app identity.
 * theme="dark"  → text rendered white (used over hero / dark backgrounds)
 * theme="light" → text rendered in brand blue (used on white header/footer)
 */
export function CaciLogo({
  className,
  variant = "full",
  theme = "light",
}: LogoProps) {
  const isDark = theme === "dark";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Real CACI logo image */}
      <div className="size-10 shrink-0 rounded-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="CACI Logo"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-lg font-bold tracking-tight",
              isDark ? "text-white" : "text-[#004BA0]"
            )}
          >
            Assakae Central
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.2em]",
              isDark ? "text-blue-300" : "text-[#C60026]"
            )}
          >
            Assembly · CACI
          </span>
        </div>
      )}
    </div>
  );
}
