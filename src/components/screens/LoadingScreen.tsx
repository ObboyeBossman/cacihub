"use client";

import { OneUiBootLoader } from "@/components/ui/OneUiBootLoader";

interface LoadingScreenProps {
  /** Optional status message shown below the spinner */
  message?: string;
}

/**
 * Full-screen loading state for portal transitions and async state loading.
 * Automatically adapts to light (CACI Blue) and dark (Dark Navy) themes.
 */
export function LoadingScreen({ message = "Loading…" }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#004BA0] dark:bg-[#0b1320] gap-5 transition-colors">
      <OneUiBootLoader size={48} speed="1.4s" />
      <p className="text-[12px] font-semibold tracking-wider uppercase text-white/60 dark:text-slate-400 font-sans">
        {message}
      </p>
    </div>
  );
}
