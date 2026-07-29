import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "mark";
  theme?: "light" | "dark";
}

/**
 * CACI — Christ Apostolic Church / Assakae Central Assembly emblem.
 * A shield crest with a cross, open Bible, and radiant light.
 */
export function CaciLogo({
  className,
  variant = "full",
  theme = "light",
}: LogoProps) {
  const isDark = theme === "dark";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 64 64"
        className="size-10 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Shield */}
        <path
          d="M32 4 L56 12 V32 C56 46 46 56 32 60 C18 56 8 46 8 32 V12 Z"
          fill={isDark ? "#0d1117" : "#ffffff"}
          stroke={isDark ? "#4D9FFF" : "#004BA0"}
          strokeWidth="2"
        />
        {/* Inner shield gradient */}
        <defs>
          <linearGradient id="caciShieldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#004BA0" />
            <stop offset="100%" stopColor="#003578" />
          </linearGradient>
          <linearGradient id="caciCrossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF1A46" />
            <stop offset="100%" stopColor="#C60026" />
          </linearGradient>
        </defs>
        <path
          d="M32 8 L52 14.5 V32 C52 43.5 43.5 52.5 32 56 C20.5 52.5 12 43.5 12 32 V14.5 Z"
          fill="url(#caciShieldGrad)"
        />
        {/* Radiant light rays */}
        <g opacity="0.25">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="32"
              y1="32"
              x2="32"
              y2="14"
              stroke="#4D9FFF"
              strokeWidth="1"
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
        </g>
        {/* Cross */}
        <rect x="29.5" y="18" width="5" height="22" rx="1" fill="url(#caciCrossGrad)" />
        <rect x="23" y="24.5" width="18" height="5" rx="1" fill="url(#caciCrossGrad)" />
        {/* Open Bible at base */}
        <path
          d="M20 44 Q26 41 32 44 Q38 41 44 44 L44 48 Q38 45 32 48 Q26 45 20 48 Z"
          fill="#ffffff"
          opacity="0.9"
        />
        <line x1="32" y1="44" x2="32" y2="48" stroke="#003578" strokeWidth="0.8" />
      </svg>
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
