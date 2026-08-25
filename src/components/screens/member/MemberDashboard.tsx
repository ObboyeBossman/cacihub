"use client";

import { useState } from "react";
import { Settings, MessageSquare } from "lucide-react";
import { useApp } from "@/lib/store";
import { CACISkeleton } from "@/components/caci/ui";
import { cn } from "@/lib/utils";

export function MemberDashboard() {
  const { user, navigate } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const fullName = user?.fullName || "Friend";
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "Friend";
  const greetingName = `${firstName}`;

  // Derive initials for fallback avatar (up to 2 characters)
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : (nameParts[0]?.[0] ?? "?").toUpperCase();

  const profilePhotoUrl = user?.profilePhotoUrl ?? null;

  return (
    <div className="min-h-screen bg-surface-page text-foreground font-sans p-6 sm:p-10 select-none flex justify-center relative">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-caci-blue text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      <div className="w-full max-w-2xl space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={fullName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-caci-blue flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-bold text-base sm:text-lg leading-none select-none">
                  {initials}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm text-n500 font-medium flex items-center gap-1.5">
                Welcome back, {greetingName} 👋
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-n900 leading-tight">
                Good Morning
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate("member-profile")}
            className="relative w-12 h-12 rounded-full bg-surface-card flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
            aria-label="Open profile"
          >
            <Settings className="w-5 h-5 text-n700" />
          </button>
        </header>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-n900 tracking-tight">What&apos;s On</h2>
            <button onClick={() => showToast("Viewing all events...")} className="text-xs font-semibold text-n500 hover:text-n900">
              See all
            </button>
          </div>

          <div
            onClick={() => showToast("Opening Main Sanctuary details...")}
            className="w-full max-w-[420px] h-[300px] bg-surface-card p-[5px] rounded-[15px] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:shadow-[0_25px_55px_-10px_rgba(0,0,0,0.18)] mx-auto border border-slate-100/80 cursor-pointer overflow-hidden relative"
          >
            <div className="relative w-full h-[200px] overflow-hidden rounded-[7px] group bg-surface-card-alt">
              {imageLoading && (
                <CACISkeleton className="absolute inset-0 w-full h-full rounded-[7px] z-10" />
              )}
              <img
                src="/images/member-dashboard/whats-on-harvest.png"
                alt="Harvest"
                onLoad={() => setImageLoading(false)}
                className={cn(
                  "w-full h-full object-cover transition-all duration-700 group-hover:scale-105",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
              />
            </div>

            <div className="flex items-center justify-between pt-3 pb-1 px-2 flex-1 gap-3">
              <div className="flex flex-col min-w-0 flex-1">
                {imageLoading ? (
                  <div className="space-y-1.5 py-0.5">
                    <CACISkeleton className="h-4 w-3/4" />
                    <CACISkeleton className="h-3 w-1/2" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight">Harvest Celebration</h3>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">Communion Service • Pastor Vance • Worship & Fellowship</span>
                  </>
                )}
              </div>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  showToast("Opening details for Main Sanctuary...");
                }}
                className="flex items-center justify-center bg-caci-blue-light hover:bg-caci-blue active:scale-95 transition-all text-white px-3 py-2 rounded-full shadow-[0_4px_14px_rgba(0,132,255,0.35)] font-semibold text-[12px] cursor-pointer whitespace-nowrap"
                aria-label="View details for Main Sanctuary"
              >
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pastoral Care CTA */}
        <div className="bg-n900 dark:bg-surface-card rounded-[20px] p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[14px] bg-n700 dark:bg-surface-card-alt flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-white leading-tight">Need Pastoral Care?</h3>
              <p className="text-[13px] text-slate-400 font-medium mt-0.5">Connect directly with our care ministers.</p>
            </div>
          </div>

          <div className="pt-1 border-t border-white/10">
            <button
              disabled
              aria-disabled="true"
              className="w-full py-4 rounded-[14px] bg-white text-n900 font-bold text-[15px] tracking-tight
                         opacity-40 cursor-not-allowed select-none"
            >
              Request Counseling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
