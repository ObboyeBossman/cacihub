"use client";

interface OneUiBootLoaderProps {
  size?: number;
  speed?: string;
}

export function OneUiBootLoader({ size = 44, speed = "1.4s" }: OneUiBootLoaderProps) {
  const colors = ["#FFFFFF", "#E2E8F0", "#94A3B8", "#64748B"];
  const dotSize = Math.max(5, Math.round(size / 4.4));

  return (
    <div
      className="relative flex items-center justify-center animate-spin"
      style={{ width: size, height: size, animationDuration: speed }}
    >
      <div
        className="absolute top-0 rounded-full animate-pulse"
        style={{ width: dotSize, height: dotSize, backgroundColor: colors[0] }}
      />
      <div
        className="absolute right-0 rounded-full animate-pulse"
        style={{ width: dotSize, height: dotSize, backgroundColor: colors[1], animationDelay: "0.35s" }}
      />
      <div
        className="absolute bottom-0 rounded-full animate-pulse"
        style={{ width: dotSize, height: dotSize, backgroundColor: colors[2], animationDelay: "0.70s" }}
      />
      <div
        className="absolute left-0 rounded-full animate-pulse"
        style={{ width: dotSize, height: dotSize, backgroundColor: colors[3], animationDelay: "1.05s" }}
      />
    </div>
  );
}
