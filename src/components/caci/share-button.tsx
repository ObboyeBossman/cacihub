"use client";

import { useState, useCallback, useEffect } from "react";
import { Share2, Copy, Check, X, MessageCircle, Facebook, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Config ──
const SITE_NAME = "CACI Assakae Central Assembly";

interface ShareButtonProps {
  /** The path to share (e.g. "/sermons/series/abc"). Prefixed with the app origin. */
  path: string;
  /** Full URL override (takes precedence over path) */
  url?: string;
  /** Title shown in the share sheet / preview */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional cover image URL */
  coverImageUrl?: string | null;
  /** Button className override */
  className?: string;
  /** Button size: 'sm' for icon-only, 'md' for icon + label */
  size?: "sm" | "md";
  /** Icon color class */
  iconClassName?: string;
}

function useShareUrl(path: string, url?: string): string {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (url) return;
    setOrigin(window.location.origin);
  }, [url]);
  if (url) return url;
  const base = origin || process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base}${path}`;
}

export function ShareButton({
  path,
  url,
  title,
  description,
  coverImageUrl,
  className,
  size = "md",
  iconClassName,
}: ShareButtonProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = useShareUrl(path, url);

  const shareText = description
    ? `${title}\n\n${description}\n\n`
    : `${title}\n\n`;

  const handleShare = useCallback(async () => {
    // Prefer native Web Share API (works on mobile Safari, Chrome, etc.)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch (e: any) {
        // User cancelled or error — fall through to custom sheet
        if (e.name === "AbortError") return;
      }
    }
    setShowSheet(true);
  }, [title, shareText, shareUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = `${shareText}${shareUrl}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText, shareUrl]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${shareText}${shareUrl}`);

  const platforms = [
    {
      name: "WhatsApp",
      icon: <MessageCircle size={20} className="text-[#25D366]" />,
      href: `https://wa.me/?text=${encodedText}`,
      color: "hover:bg-[#25D366]/10",
    },
    {
      name: "Facebook",
      icon: <Facebook size={20} className="text-[#1877F2]" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-[#1877F2]/10",
    },
    {
      name: "X (Twitter)",
      icon: <Twitter size={20} className="text-n700" />,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodedUrl}`,
      color: "hover:bg-n100",
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-95",
          size === "md" && "px-3.5 py-2 rounded-xl bg-n100 text-n600 hover:bg-n200 font-medium text-[13px]",
          size === "sm" && "size-9 rounded-full bg-white/15 hover:bg-white/25 text-white",
          className,
        )}
        aria-label="Share"
      >
        <Share2 size={size === "sm" ? 18 : 15} className={iconClassName} />
        {size === "md" && "Share"}
      </button>

      {/* ── Share bottom sheet ── */}
      {showSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowSheet(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-[16px] font-bold text-n900">Share</h3>
              <button
                type="button"
                onClick={() => setShowSheet(false)}
                className="size-8 flex items-center justify-center rounded-full text-n400 hover:text-n700 hover:bg-n50 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview card */}
            <div className="mx-5 mb-4 p-3 rounded-xl border border-n100 bg-n50 flex items-center gap-3">
              {coverImageUrl ? (
                <div className="size-12 rounded-lg overflow-hidden shrink-0 bg-n100">
                  <img
                    src={coverImageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="size-12 rounded-lg bg-caci-blue-bg flex items-center justify-center shrink-0">
                  <Share2 size={18} className="text-caci-blue" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-n900 truncate">{title}</p>
                <p className="text-[11px] text-n400 truncate">{SITE_NAME}</p>
              </div>
            </div>

            {/* Platform buttons */}
            <div className="px-5 pb-3 space-y-1.5">
              {platforms.map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowSheet(false)}
                  className={cn(
                    "flex items-center gap-3.5 w-full px-3.5 py-3 rounded-xl transition-colors duration-150",
                    p.color,
                  )}
                >
                  {p.icon}
                  <span className="text-[14px] font-semibold text-n900">{p.name}</span>
                </a>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-n100" />

            {/* Copy link */}
            <div className="px-5 py-3">
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-3.5 w-full px-3.5 py-3 rounded-xl transition-colors duration-150",
                  copied ? "bg-emerald-50" : "hover:bg-n100",
                )}
              >
                {copied ? (
                  <Check size={20} className="text-emerald-600" />
                ) : (
                  <Copy size={20} className="text-n500" />
                )}
                <span className={cn(
                  "text-[14px] font-semibold",
                  copied ? "text-emerald-700" : "text-n900",
                )}>
                  {copied ? "Copied!" : "Copy link"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
