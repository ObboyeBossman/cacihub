"use client";

import { OneUiBootLoader } from "@/components/ui/OneUiBootLoader";

interface LoadingScreenProps {
  /** Optional status message shown below the spinner */
  message?: string;
}

/**
 * Lightweight full-screen loading state.
 * Used for all loading moments after the initial app launch.
 * The SplashScreen is reserved for first app boot only.
 */
export function LoadingScreen({ message = "Loading…" }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#004BA0] gap-5">
      <OneUiBootLoader size={48} speed="1.4s" />
      <p
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}
