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
  url?: string;
  caption?: string;
  title?: string;
  body?: string;
  reference?: string;
  bgFrom?: string;
  bgTo?: string;
  time: string;
  duration: number;
}

interface StatusUser {
  id: string;
  name: string;
  avatar: string;
  hasUnseen: boolean;
  slides: Slide[];
}

// ─────────────────────────────────────────────
// Seed data
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

function SegmentedRing({ count, unseen, size = 56 }: { count: number; unseen: boolean; size?: number }) {
  const strokeWidth = 2.8;
  const center = size / 2;
  const radius = center - strokeWidth - 1;
  const circumference = 2 * Math.PI * radius;
  const color = unseen ? "#004ba0" : "#c9d1d9";

  if (count <= 1) {
    return (
      <svg className="absolute inset-0 -rotate-90 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  const gapDeg = 10;
  const segDeg = (360 - count * gapDeg) / count;
  const segDash = (segDeg / 360) * circumference;
  const gapDash = (gapDeg / 360) * circumference;

  return (
    <svg className="absolute inset-0 -rotate-90 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${segDash} ${gapDash}`} />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Slide content
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
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        {slide.caption && (
          <div className="absolute bottom-28 left-4 right-4 z-10">
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
        style={{ background: `linear-gradient(135deg, ${slide.bgFrom ?? "#0f2044"}, ${slide.bgTo ?? "#1a3a6e"})` }}
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
// Viewer — fullscreen story player
// ─────────────────────────────────────────────

interface ViewerProps {
  users: StatusUser[];
  initialUserIdx: number;
  onClose: () => void;
  onMarkSeen: (userId: string) => void;
}

function StoryViewer({ users, initialUserIdx, onClose, onMarkSeen }: ViewerProps) {
  const [activeUserIdx, setActiveUserIdx] = useState(initialUserIdx);
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPausedUI, setIsPausedUI] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; emoji: string }[]>([]);

  // Drag state for between-user swipe
  const dragRef = useRef<{ startX: number; startY: number; deltaX: number; dragging: boolean; tapStart: number; isHorizontal: boolean | undefined }>(
    { startX: 0, startY: 0, deltaX: 0, dragging: false, tapStart: 0, isHorizontal: undefined }
  );
  const isPausedRef = useRef(false);
  const isHoldingRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartIdRef = useRef(0);

  // The current user card slides in/out; we track x offset of the entire viewer
  const viewerRef = useRef<HTMLDivElement>(null);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);

  const activeUser = users[activeUserIdx];
  const currentSlide = activeUser?.slides[slideIdx];
  const totalSlides = activeUser?.slides.length ?? 0;

  // ── Toast ──
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2500);
  }, []);

  // ── Hearts ──
  const spawnHeart = useCallback((emoji = "❤️") => {
    const id = ++heartIdRef.current;
    const x = 20 + Math.random() * 60;
    setFloatingHearts((prev) => [...prev, { id, x, emoji }]);
    window.setTimeout(() => setFloatingHearts((prev) => prev.filter((h) => h.id !== id)), 1200);
  }, []);

  // ── Timer ──
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const pause = useCallback(() => { isPausedRef.current = true; setIsPausedUI(true); }, []);
  const resume = useCallback(() => { isPausedRef.current = false; setIsPausedUI(false); isHoldingRef.current = false; }, []);

  const startTimer = useCallback((durationSec: number) => {
    clearTimer();
    setProgress(0);
    const step = 50;
    const total = (durationSec * 1000) / step;
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      elapsed++;
      setProgress((elapsed / total) * 100);
      if (elapsed >= total) {
        clearTimer();
        // Auto-advance slide within same user
        setSlideIdx((prev) => {
          if (prev < totalSlides - 1) return prev + 1;
          // Last slide of this user — try next user
          goToUser(activeUserIdx + 1);
          return prev;
        });
      }
    }, step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSlides, activeUserIdx]);

  // ── Navigate to a specific user ──
  const goToUser = useCallback((nextIdx: number, dir?: "left" | "right") => {
    if (nextIdx < 0 || nextIdx >= users.length) {
      if (nextIdx >= users.length) onClose();
      return;
    }
    setExitDir(dir ?? (nextIdx > activeUserIdx ? "left" : "right"));
    setIsTransitioning(true);
    window.setTimeout(() => {
      setActiveUserIdx(nextIdx);
      setSlideIdx(0);
      setLiked(false);
      setSwipeOffsetX(0);
      setIsTransitioning(false);
      setExitDir(null);
      onMarkSeen(users[nextIdx].id);
    }, 220);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserIdx, users, onClose, onMarkSeen]);

  // ── Slide navigation (within same user) ──
  const goNextSlide = useCallback(() => {
    if (slideIdx < totalSlides - 1) {
      setSlideIdx((p) => p + 1);
    } else {
      goToUser(activeUserIdx + 1, "left");
    }
  }, [slideIdx, totalSlides, activeUserIdx, goToUser]);

  const goPrevSlide = useCallback(() => {
    if (slideIdx > 0) {
      setSlideIdx((p) => p - 1);
    } else {
      goToUser(activeUserIdx - 1, "right");
    }
  }, [slideIdx, activeUserIdx, goToUser]);

  // ── Restart timer on slide/user change ──
  useEffect(() => {
    if (!currentSlide) return;
    startTimer(currentSlide.duration);
    return () => clearTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserIdx, slideIdx]);

  // ── Mark first user seen on mount ──
  useEffect(() => {
    onMarkSeen(users[initialUserIdx].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Escape key ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Touch / pointer handlers ──
  // Swipe LEFT  → go to next user's status
  // Swipe RIGHT → go to prev user's status
  // Short tap   → advance/rewind slide within current user

  const onPointerDown = useCallback((x: number, y: number) => {
    if (isTransitioning) return;
    dragRef.current = { startX: x, startY: y, deltaX: 0, dragging: true, tapStart: Date.now(), isHorizontal: undefined };
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      pause();
    }, 200);
  }, [isTransitioning, pause]);

  const onPointerMove = useCallback((x: number, y: number) => {
    if (!dragRef.current.dragging) return;
    const dx = x - dragRef.current.startX;
    const dy = y - dragRef.current.startY;
    dragRef.current.deltaX = dx;

    // Lock axis on first significant movement
    if (dragRef.current.isHorizontal === undefined && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      dragRef.current.isHorizontal = Math.abs(dx) > Math.abs(dy);
    }

    if (dragRef.current.isHorizontal) {
      // Cancel hold timer — user is swiping between users, not holding
      if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
      pause();
      // Follow finger with damping near edges
      const maxPull = 120;
      const clamped = Math.max(-maxPull, Math.min(maxPull, dx));
      setSwipeOffsetX(clamped);
    }
  }, [pause]);

  const onPointerUp = useCallback((x: number) => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;

    const { deltaX, tapStart, isHorizontal } = dragRef.current;
    const elapsed = Date.now() - tapStart;
    const abs = Math.abs(deltaX);

    setSwipeOffsetX(0);

    if (isHoldingRef.current) {
      // Was a hold-pause — just resume
      resume();
      return;
    }

    if (!isHorizontal && abs < 14 && elapsed < 250) {
      // Tap — navigate slide within user
      resume();
      const screenW = window.innerWidth;
      if (x < screenW * 0.35) goPrevSlide();
      else goNextSlide();
      return;
    }

    if (isHorizontal && abs > 50) {
      // Horizontal swipe — move to adjacent user
      if (deltaX < 0) goToUser(activeUserIdx + 1, "left");
      else goToUser(activeUserIdx - 1, "right");
    } else {
      resume();
    }
  }, [resume, goPrevSlide, goNextSlide, goToUser, activeUserIdx]);

  // ── Slide transition CSS ──
  const slideTransform = (() => {
    if (isTransitioning && exitDir === "left") return "translateX(-100vw)";
    if (isTransitioning && exitDir === "right") return "translateX(100vw)";
    return `translateX(${swipeOffsetX}px)`;
  })();

  const reactEmoji = (emoji: string) => {
    spawnHeart(emoji);
    showToast(`Sent ${emoji}`);
  };

  if (!activeUser || !currentSlide) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black overflow-hidden touch-none select-none"
      style={{ width: "100vw", height: "100dvh" }}
    >
      {/* ── Main swipeable card ── */}
      <div
        ref={viewerRef}
        className="absolute inset-0 will-change-transform"
        style={{
          transform: slideTransform,
          transition: swipeOffsetX === 0 ? "transform 220ms cubic-bezier(0.22,1,0.36,1)" : "none",
          width: "100vw",
          height: "100dvh",
        }}
        onMouseDown={(e) => onPointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => onPointerMove(e.clientX, e.clientY)}
        onMouseUp={(e) => onPointerUp(e.clientX)}
        onMouseLeave={(e) => { if (dragRef.current.dragging) onPointerUp(e.clientX); }}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => { e.preventDefault(); onPointerMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchEnd={(e) => onPointerUp(e.changedTouches[0].clientX)}
      >
        {/* Full-bleed slide */}
        <div className="absolute inset-0">
          <SlideContent slide={currentSlide} />
        </div>

        {/* Floating hearts */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {floatingHearts.map((h) => (
            <span
              key={h.id}
              className="absolute text-2xl"
              style={{ left: `${h.x}%`, bottom: "140px", animation: "floatUp 1.2s ease-out forwards" }}
            >
              {h.emoji}
            </span>
          ))}
        </div>

        {/* ── Top HUD ── */}
        <div className="absolute top-0 left-0 right-0 z-30 pt-safe">
          <div className="px-3 pt-4 pb-3 bg-gradient-to-b from-black/70 via-black/20 to-transparent">
            {/* Segmented progress bars */}
            <div className="flex gap-1 mb-3">
              {activeUser.slides.map((_, i) => (
                <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width: i < slideIdx ? "100%" : i === slideIdx ? `${progress}%` : "0%",
                      opacity: isPausedUI && i === slideIdx ? 0.5 : 1,
                      transition: "opacity 150ms ease",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* User header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                  className="p-1.5 text-white/80 hover:text-white active:scale-90 transition-transform"
                  aria-label="Close"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeUser.avatar} alt={activeUser.name} className="w-9 h-9 rounded-full object-cover border border-white/20" draggable={false} />
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{activeUser.name}</p>
                  <p className="text-white/60 text-[11px]">{currentSlide.time} · {slideIdx + 1}/{totalSlides}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setMuted((m) => !m)} className="p-2 text-white/70 hover:text-white active:scale-90 transition-transform" aria-label={muted ? "Unmute" : "Mute"}>
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button onMouseDown={(e) => e.stopPropagation()} onClick={() => showToast("More options coming soon")} className="p-2 text-white/70 hover:text-white active:scale-90 transition-transform" aria-label="More options">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Prev/next user arrows (desktop) ── */}
        {activeUserIdx > 0 && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => goToUser(activeUserIdx - 1, "right")}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 items-center justify-center text-white hover:bg-black/75 transition"
            aria-label="Previous person"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {activeUserIdx < users.length - 1 && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => goToUser(activeUserIdx + 1, "left")}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 items-center justify-center text-white hover:bg-black/75 transition"
            aria-label="Next person"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* ── Invisible tap zones (left/right third) ── */}
        <div className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer" onClick={goPrevSlide} aria-label="Previous slide" role="button" />
        <div className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer" onClick={goNextSlide} aria-label="Next slide" role="button" />

        {/* ── Bottom bar ── */}
        <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-8 pt-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => pause()}
                onBlur={() => resume()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && replyText.trim()) {
                    showToast(`Reply sent to ${activeUser.name}`);
                    setReplyText("");
                  }
                }}
                placeholder={`Reply to ${activeUser.name.split(" ")[0]}…`}
                className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 text-sm rounded-full py-2.5 pl-4 pr-10 border border-white/15 focus:outline-none focus:border-white/40 transition-colors"
              />
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => { if (replyText.trim()) { showToast(`Reply sent to ${activeUser.name}`); setReplyText(""); } }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white active:scale-90 transition"
                aria-label="Send reply"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {(["🙏", "😍"] as const).map((emoji) => (
              <button
                key={emoji}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => reactEmoji(emoji)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-transform border border-white/10"
                aria-label={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}

            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => showToast("Reshared to your updates")}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:scale-110 active:scale-90 transition-transform border border-white/10"
              aria-label="Reshare"
            >
              <Repeat2 className="w-4 h-4" />
            </button>

            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                setLiked((l) => {
                  if (!l) { spawnHeart("❤️"); showToast("Liked"); }
                  return !l;
                });
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-90 border ${
                liked ? "bg-red-500/20 border-red-500/40 text-red-500" : "bg-white/10 border-white/10 text-white/70 hover:text-white"
              }`}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <Heart className={`w-5 h-5 transition-all ${liked ? "fill-red-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Ghost peek of adjacent user (swipe feedback) ── */}
      {swipeOffsetX > 20 && activeUserIdx > 0 && (
        <div
          className="absolute inset-0 z-[90] pointer-events-none"
          style={{ transform: `translateX(${swipeOffsetX - window.innerWidth}px)`, opacity: Math.min(1, swipeOffsetX / 80) }}
        >
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={users[activeUserIdx - 1].avatar} alt={users[activeUserIdx - 1].name} className="w-20 h-20 rounded-full object-cover border-4 border-white/30" draggable={false} />
          </div>
        </div>
      )}
      {swipeOffsetX < -20 && activeUserIdx < users.length - 1 && (
        <div
          className="absolute inset-0 z-[90] pointer-events-none"
          style={{ transform: `translateX(${window.innerWidth + swipeOffsetX}px)`, opacity: Math.min(1, Math.abs(swipeOffsetX) / 80) }}
        >
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={users[activeUserIdx + 1].avatar} alt={users[activeUserIdx + 1].name} className="w-20 h-20 rounded-full object-cover border-4 border-white/30" draggable={false} />
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-n900/90 text-white text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0)    scale(0.8); opacity: 1; }
          100% { transform: translateY(-90px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main export — tray + viewer
// ─────────────────────────────────────────────

export function MemberUpdates() {
  const [users, setUsers] = useState<StatusUser[]>(SEED_USERS);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [openUserIdx, setOpenUserIdx] = useState(0);

  const openViewer = (idx: number) => {
    setOpenUserIdx(idx);
    setViewerOpen(true);
  };

  const markSeen = useCallback((userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, hasUnseen: false } : u));
  }, []);

  return (
    <>
      {/* ── Status tray ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-n900 tracking-tight px-1">Updates</h2>
        <div
          className="flex gap-4 overflow-x-auto pb-1 px-1 scrollbar-hide"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {users.map((user, idx) => (
            <button
              key={user.id}
              onClick={() => openViewer(idx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
              aria-label={`View ${user.name}'s updates`}
            >
              <div className="relative w-14 h-14 flex items-center justify-center">
                <SegmentedRing count={user.slides.length} unseen={user.hasUnseen} />
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

      {/* ── Story viewer (portal-like fixed overlay) ── */}
      {viewerOpen && (
        <StoryViewer
          users={users}
          initialUserIdx={openUserIdx}
          onClose={() => setViewerOpen(false)}
          onMarkSeen={markSeen}
        />
      )}
    </>
  );
}
