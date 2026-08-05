"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  ArrowLeft,
  Send,
  Heart,
  Repeat2,
  Volume2,
  VolumeX,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Slide {
  type: "image" | "text" | "scripture";
  /** For image slides */
  url?: string;
  caption?: string;
  /** For text slides */
  title?: string;
  body?: string;
  reference?: string;
  bgFrom?: string;
  bgTo?: string;
  time: string;
  duration: number; // seconds
}

interface StatusUser {
  id: string;
  name: string;
  avatar: string;
  hasUnseen: boolean;
  slides: Slide[];
}

// ─────────────────────────────────────────────
// Hardcoded seed data (uses existing project images)
// ─────────────────────────────────────────────

const SEED_USERS: StatusUser[] = [
  {
    id: "robert",
    name: "Robert Mensah",
    avatar: "/images/member-dashboard/updates-1.webp",
    hasUnseen: true,
    slides: [
      {
        type: "scripture",
        title: "Verse of the Day",
        body: "Whoever can be trusted with very little can also be trusted with much, and whoever is dishonest with very little will also be dishonest with much.",
        reference: "Luke 16:10",
        bgFrom: "#0f2044",
        bgTo: "#1a3a6e",
        time: "8h ago",
        duration: 7,
      },
      {
        type: "image",
        url: "/images/member-dashboard/updates-2.webp",
        caption: "Morning devotion walk — meditating on the Word 🌿🙏",
        time: "6h ago",
        duration: 5,
      },
      {
        type: "text",
        title: "Daily Reflection",
        body: "Faith can move mountains. Stay consistent in the little things today!",
        reference: "Matthew 17:20",
        bgFrom: "#1e1b4b",
        bgTo: "#312e81",
        time: "2h ago",
        duration: 5,
      },
    ],
  },
  {
    id: "kwame",
    name: "Kwame Asante",
    avatar: "/images/member-dashboard/updates-2.webp",
    hasUnseen: true,
    slides: [
      {
        type: "image",
        url: "/images/member-dashboard/updates-3.png",
        caption: "Weekend vibes with the squad 🎉💯",
        time: "Yesterday",
        duration: 5,
      },
      {
        type: "text",
        title: "Good Morning",
        body: "Rise and shine, saints! Today is another gift from the Lord. Make it count.",
        bgFrom: "#064e3b",
        bgTo: "#065f46",
        time: "8h ago",
        duration: 6,
      },
    ],
  },
  {
    id: "bright",
    name: "Bright Lord",
    avatar: "/images/member-dashboard/updates-3.png",
    hasUnseen: true,
    slides: [
      {
        type: "scripture",
        title: "Isaiah 57:15",
        body: "For thus saith the high and lofty One that inhabiteth eternity, whose name is Holy; I dwell in the high and holy place, with him also that is of a contrite and humble spirit.",
        reference: "Isaiah 57:15",
        bgFrom: "#1c1917",
        bgTo: "#292524",
        time: "Today, 12:34 pm",
        duration: 8,
      },
    ],
  },
  {
    id: "beatrice",
    name: "Beatrice Osei",
    avatar: "/images/member-dashboard/updates-4.png",
    hasUnseen: true,
    slides: [
      {
        type: "image",
        url: "/images/member-dashboard/updates-4.png",
        caption: "Blessed Wednesday everyone ✨✨",
        time: "3h ago",
        duration: 5,
      },
      {
        type: "text",
        title: "Grateful Heart",
        body: "Count your blessings, name them one by one — and it will surprise you what the Lord has done.",
        bgFrom: "#1e3a5f",
        bgTo: "#0f2044",
        time: "1h ago",
        duration: 5,
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Segmented SVG ring
// ─────────────────────────────────────────────

function SegmentedRing({
  count,
  unseen,
  size = 56,
}: {
  count: number;
  unseen: boolean;
  size?: number;
}) {
  const strokeWidth = 2.8;
  const center = size / 2;
  const radius = center - strokeWidth - 1;
  const circumference = 2 * Math.PI * radius;
  const color = unseen ? "#004ba0" : "#c9d1d9";

  if (count <= 1) {
    return (
      <svg
        className="absolute inset-0 -rotate-90 pointer-events-none"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  const gapDeg = 10;
  const segDeg = (360 - count * gapDeg) / count;
  const segDash = (segDeg / 360) * circumference;
  const gapDash = (gapDeg / 360) * circumference;

  return (
    <svg
      className="absolute inset-0 -rotate-90 pointer-events-none"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${segDash} ${gapDash}`}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Slide content renderer
// ─────────────────────────────────────────────

function SlideContent({ slide }: { slide: Slide }) {
  if (slide.type === "image") {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.url}
          alt={slide.caption ?? "Status"}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        {slide.caption && (
          <div className="absolute bottom-24 left-4 right-4 z-10">
            <p className="text-white text-[15px] font-medium leading-snug text-center drop-shadow">
              {slide.caption}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (slide.type === "text" || slide.type === "scripture") {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center px-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${slide.bgFrom ?? "#0f2044"}, ${slide.bgTo ?? "#1a3a6e"})`,
        }}
      >
        {slide.title && (
          <p className="text-white/60 text-xs font-semibold tracking-[0.15em] uppercase mb-5">
            {slide.title}
          </p>
        )}
        <p className="text-white text-[22px] font-light leading-relaxed font-serif max-w-xs">
          &ldquo;{slide.body}&rdquo;
        </p>
        {slide.reference && (
          <span className="mt-6 text-white/50 text-sm font-medium tracking-wide">
            — {slide.reference}
          </span>
        )}
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function MemberUpdates() {
  const [users, setUsers] = useState<StatusUser[]>(SEED_USERS);

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeUserIdx, setActiveUserIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  // isPaused lives in a ref so the setInterval callback always reads the live
  // value — React state is stale inside interval closures.
  const isPausedRef = useRef(false);
  const [isPausedUI, setIsPausedUI] = useState(false); // drives progress bar visual only
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Hold-to-pause: fires after 200 ms of continuous press
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number; emoji: string }[]
  >([]);

  // Progress
  const [progress, setProgress] = useState(0); // 0–100
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartIdRef = useRef(0);

  // Touch / drag
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    deltaX: 0,
    dragging: false,
    tapStart: 0,
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeUser = users[activeUserIdx];
  const currentSlide = activeUser?.slides[slideIdx];
  const totalSlides = activeUser?.slides.length ?? 0;

  // ── Toast ──
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Hearts ──
  const spawnHeart = useCallback((emoji = "❤️") => {
    const id = ++heartIdRef.current;
    const x = 20 + Math.random() * 60;
    setFloatingHearts((prev) => [...prev, { id, x, emoji }]);
    window.setTimeout(
      () => setFloatingHearts((prev) => prev.filter((h) => h.id !== id)),
      1200
    );
  }, []);

  // ── Timer ──
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(
    (durationSec: number) => {
      clearTimer();
      setProgress(0);
      const step = 50; // ms
      const total = (durationSec * 1000) / step;
      let elapsed = 0;

      timerRef.current = setInterval(() => {
        if (isPausedRef.current || isTransitioning) return;
        elapsed++;
        setProgress((elapsed / total) * 100);
        if (elapsed >= total) {
          clearTimer();
          goNextSlide();
        }
      }, step);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isTransitioning]
  );

  // ── Navigation ──
  const openViewer = useCallback(
    (userIdx: number) => {
      setActiveUserIdx(userIdx);
      setSlideIdx(0);
      setProgress(0);
      setLiked(false);
      setIsTransitioning(false);
      setViewerOpen(true);

      // Mark seen
      setUsers((prev) =>
        prev.map((u, i) => (i === userIdx ? { ...u, hasUnseen: false } : u))
      );
    },
    []
  );

  const closeViewer = useCallback(() => {
    clearTimer();
    setViewerOpen(false);
    setIsTransitioning(false);
  }, [clearTimer]);

  const goNextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    window.setTimeout(() => {
      setSlideIdx((prev) => {
        if (prev < totalSlides - 1) {
          setIsTransitioning(false);
          return prev + 1;
        }
        // Move to next user
        setActiveUserIdx((ui) => {
          const next = ui + 1;
          if (next >= users.length) {
            closeViewer();
            return ui;
          }
          setSlideIdx(0);
          setLiked(false);
          setUsers((p) =>
            p.map((u, i) => (i === next ? { ...u, hasUnseen: false } : u))
          );
          setIsTransitioning(false);
          return next;
        });
        return prev;
      });
    }, 180);
  }, [isTransitioning, totalSlides, users.length, closeViewer]);

  const goPrevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    window.setTimeout(() => {
      setSlideIdx((prev) => {
        if (prev > 0) {
          setIsTransitioning(false);
          return prev - 1;
        }
        // Move to prev user
        setActiveUserIdx((ui) => {
          const prev2 = ui - 1;
          if (prev2 < 0) {
            setIsTransitioning(false);
            return ui;
          }
          const prevUser = users[prev2];
          setSlideIdx(prevUser.slides.length - 1);
          setLiked(false);
          setIsTransitioning(false);
          return prev2;
        });
        return prev;
      });
    }, 180);
  }, [isTransitioning, users]);

  // ── Timer restart whenever slide or user changes ──
  useEffect(() => {
    if (!viewerOpen || !currentSlide) return;
    startTimer(currentSlide.duration);
    return () => clearTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen, activeUserIdx, slideIdx]);

  // ── Pause / resume helpers ──
  const pause = useCallback(() => {
    isPausedRef.current = true;
    setIsPausedUI(true);
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setIsPausedUI(false);
    isHoldingRef.current = false;
  }, []);

  // ── Touch / mouse drag on canvas ──
  const handleDragStart = useCallback((x: number) => {
    if (isTransitioning) return;
    dragRef.current = {
      startX: x,
      startY: 0,
      deltaX: 0,
      dragging: true,
      tapStart: Date.now(),
    };
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = "none";
    }

    // Hold-to-pause: wait 200 ms before treating this as a hold.
    // If the finger lifts before that, handleDragEnd sees it as a tap.
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      pause();
    }, 200);
  }, [isTransitioning, pause]);

  const handleDragMove = useCallback((x: number) => {
    if (!dragRef.current.dragging) return;
    const delta = x - dragRef.current.startX;
    dragRef.current.deltaX = delta;
    if (wrapperRef.current && Math.abs(delta) > 8) {
      const scale = Math.max(0.88, 1 - Math.abs(delta) / 900);
      const rot = delta * 0.035;
      const opacity = Math.max(0.45, 1 - Math.abs(delta) / 550);
      wrapperRef.current.style.transform = `translateX(${delta}px) scale(${scale}) rotate(${rot}deg)`;
      wrapperRef.current.style.opacity = String(opacity);
    }
  }, []);

  const handleDragEnd = useCallback(
    (x: number) => {
      // Cancel the hold timer no matter what — we're lifting now
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      const { deltaX, tapStart } = dragRef.current;
      const duration = Date.now() - tapStart;
      const abs = Math.abs(deltaX);

      const resetWrapper = () => {
        if (wrapperRef.current) {
          wrapperRef.current.style.transition =
            "transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease-out";
          wrapperRef.current.style.transform =
            "translateX(0) scale(1) rotate(0deg)";
          wrapperRef.current.style.opacity = "1";
        }
      };

      if (isHoldingRef.current) {
        // Was a hold — just resume, don't navigate
        resetWrapper();
        resume();
      } else if (abs < 12 && duration < 230) {
        // Quick tap — navigate
        resetWrapper();
        resume();
        const screenW = canvasRef.current?.clientWidth ?? 360;
        if (x < screenW * 0.35) goPrevSlide();
        else goNextSlide();
      } else if (abs > 60) {
        // Swipe between users
        resetWrapper();
        if (deltaX < 0) goNextSlide();
        else goPrevSlide();
        window.setTimeout(() => resume(), 320);
      } else {
        // Short drag snap-back
        resetWrapper();
        window.setTimeout(() => resume(), 280);
      }
    },
    [goNextSlide, goPrevSlide, resume]
  );

  // Close viewer on Escape key
  useEffect(() => {
    if (!viewerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewerOpen, closeViewer]);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <>
      {/* ── Status tray ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-n900 tracking-tight px-1">
          Updates
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-1 px-1 scrollbar-hide"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {users.map((user, idx) => (
            <button
              key={user.id}
              onClick={() => openViewer(idx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
              aria-label={`View ${user.name}'s updates`}
            >
              {/* Avatar + ring */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <SegmentedRing
                  count={user.slides.length}
                  unseen={user.hasUnseen}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-[46px] h-[46px] rounded-full object-cover group-hover:scale-105 transition-transform duration-200"
                  draggable={false}
                />
                {user.hasUnseen && (
                  <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-caci-blue border-2 border-white" />
                )}
              </div>
              <span className="text-[11px] text-n500 font-medium max-w-[56px] truncate text-center">
                {user.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Fullscreen story viewer ── */}
      {viewerOpen && activeUser && currentSlide && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">

          {/* Top controls */}
          <div className="absolute top-0 left-0 right-0 z-30 pt-safe px-3 pt-4 pb-3 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">

            {/* Segmented progress bars */}
            <div className="flex gap-1 mb-3">
              {activeUser.slides.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-none"
                    style={{
                      width:
                        i < slideIdx
                          ? "100%"
                          : i === slideIdx
                          ? `${progress}%`
                          : "0%",
                      opacity: isPausedUI && i === slideIdx ? 0.5 : 1,
                      transition: "opacity 150ms ease",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* User header */}
            <div className="flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeViewer}
                  className="p-1.5 text-white/80 hover:text-white active:scale-90 transition-transform"
                  aria-label="Close"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeUser.avatar}
                  alt={activeUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-white/20"
                />
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">
                    {activeUser.name}
                  </p>
                  <p className="text-white/60 text-[11px]">
                    {currentSlide.time} · {slideIdx + 1}/{totalSlides}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="p-2 text-white/70 hover:text-white active:scale-90 transition-transform"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => showToast("More options coming soon")}
                  className="p-2 text-white/70 hover:text-white active:scale-90 transition-transform"
                  aria-label="More options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Main canvas — tap/swipe area */}
          <div
            ref={canvasRef}
            className="relative w-full h-full overflow-hidden touch-pan-y"
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={(e) => handleDragEnd(e.clientX)}
            onMouseLeave={(e) => {
              if (dragRef.current.dragging) handleDragEnd(e.clientX);
            }}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
          >
            <div
              ref={wrapperRef}
              className="w-full h-full will-change-transform"
              style={{ transform: "translateX(0) scale(1) rotate(0deg)", opacity: 1 }}
            >
              <SlideContent slide={currentSlide} />
            </div>

            {/* Floating hearts layer */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {floatingHearts.map((h) => (
                <span
                  key={h.id}
                  className="absolute text-2xl animate-bounce"
                  style={{
                    left: `${h.x}%`,
                    bottom: "100px",
                    animation: "floatUp 1.2s ease-out forwards",
                  }}
                >
                  {h.emoji}
                </span>
              ))}
            </div>

            {/* Tap zones — invisible left / right */}
            <button
              className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer opacity-0"
              onClick={goPrevSlide}
              aria-label="Previous"
            />
            <button
              className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer opacity-0"
              onClick={goNextSlide}
              aria-label="Next"
            />

            {/* Desktop nav arrows */}
            {activeUserIdx > 0 && (
              <button
                onClick={() => {
                  setActiveUserIdx((i) => i - 1);
                  setSlideIdx(0);
                  setLiked(false);
                }}
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 items-center justify-center text-white hover:bg-black/70 transition"
                aria-label="Previous person"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeUserIdx < users.length - 1 && (
              <button
                onClick={() => {
                  setActiveUserIdx((i) => i + 1);
                  setSlideIdx(0);
                  setLiked(false);
                }}
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 items-center justify-center text-white hover:bg-black/70 transition"
                aria-label="Next person"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-6 pt-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div className="flex items-center gap-2">
              {/* Reply input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => pause()}
                  onBlur={() => resume()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (replyText.trim()) {
                        showToast(`Reply sent to ${activeUser.name}`);
                        setReplyText("");
                      }
                    }
                  }}
                  placeholder={`Reply to ${activeUser.name.split(" ")[0]}…`}
                  className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 text-sm rounded-full py-2.5 pl-4 pr-10 border border-white/15 focus:outline-none focus:border-white/40 transition-colors"
                />
                <button
                  onClick={() => {
                    if (replyText.trim()) {
                      showToast(`Reply sent to ${activeUser.name}`);
                      setReplyText("");
                    }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white active:scale-90 transition"
                  aria-label="Send reply"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Quick reactions */}
              {(["🙏", "😍"] as const).map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    reactEmoji(emoji);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-transform border border-white/10"
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}

              {/* Reshare */}
              <button
                onClick={() => showToast("Reshared to your updates")}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:scale-110 active:scale-90 transition-transform border border-white/10"
                aria-label="Reshare"
              >
                <Repeat2 className="w-4 h-4" />
              </button>

              {/* Like */}
              <button
                onClick={() => {
                  setLiked((l) => {
                    if (!l) {
                      spawnHeart("❤️");
                      showToast("Liked");
                    }
                    return !l;
                  });
                }}
                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-90 border ${
                  liked
                    ? "bg-red-500/20 border-red-500/40 text-red-500"
                    : "bg-white/10 border-white/10 text-white/70 hover:text-white"
                }`}
                aria-label={liked ? "Unlike" : "Like"}
              >
                <Heart
                  className={`w-5 h-5 transition-all ${liked ? "fill-red-500" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-n900 text-white text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Floating heart keyframes */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0)    scale(0.8); opacity: 1; }
          100% { transform: translateY(-90px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </>
  );

  function reactEmoji(emoji: string) {
    spawnHeart(emoji);
    showToast(`Sent ${emoji}`);
  }
}
