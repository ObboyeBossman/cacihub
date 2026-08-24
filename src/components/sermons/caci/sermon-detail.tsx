"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pause,
  Play,
  Quote,
  User,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  X,
  Maximize2,
  Loader2,
  Music,
  Video,
  ImageIcon,
  Download,
} from "lucide-react";
import type { Sermon, Quotation, SermonMedia } from "@/lib/sermons";
import { parseQuotations, formatDate, formatDuration } from "@/lib/sermons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ShareButton } from "@/components/caci/share-button";
import Link from "next/link";

interface SermonDetailProps {
  sermon: Sermon;
}

export function SermonDetail({ sermon }: SermonDetailProps) {
  if (!sermon) {
    return (
      <div className="min-h-screen bg-mesh-light">
        <div className="mx-auto max-w-4xl px-4 pt-20 pb-8 sm:pt-24 sm:pb-12 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-6 h-10 w-3/4" />
          <Skeleton className="mt-3 h-5 w-1/2" />
        </div>
      </div>
    );
  }

  const quotations = parseQuotations(sermon.quotations);
  const media = sermon.media || [];

  return (
    <div className="min-h-screen bg-mesh-light">
      {/* Top bar */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6 lg:px-8">
          <Link
            href="/sermons"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-[#004BA0]"
          >
            <ArrowLeft className="size-4" />
            <span className="max-w-[160px] sm:max-w-[200px] truncate font-semibold">
              All Sermons
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ShareButton
              path={`/sermons/sermon/${sermon.id}`}
              title={sermon.title}
              description={sermon.preacher}
              size="sm"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="gap-1.5 rounded-full bg-[#FFF0F2] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C60026]">
              <span className="font-display">
                {String(sermon.sequence).padStart(2, "0")}
              </span>
              Message {sermon.sequence}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-[#004BA0]/30 px-3 py-1 text-xs font-medium text-[#004BA0]"
            >
              {sermon.theme || "Sermon"}
            </Badge>
          </div>

          <h1 className="mt-4 sm:mt-5 font-display text-xl sm:text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {sermon.title}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F2] px-3 py-1 text-sm font-semibold text-[#C60026]">
              <BookOpen className="size-3.5" />
              {sermon.theme}
            </span>
          </div>

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="size-4 text-[#004BA0]" />
              <span className="font-serif font-semibold text-slate-800">
                {sermon.scripture}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <User className="size-4 text-[#004BA0]" />
              {sermon.preacher}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="size-4 text-[#004BA0]" />
              {formatDate(sermon.datePreached)}
            </span>
            {sermon.duration && (
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4 text-[#004BA0]" />
                {formatDuration(sermon.duration)}
              </span>
            )}
          </div>
        </motion.div>

        {/* Media content */}
        {media.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 space-y-4"
          >
            {media.map((item) => (
              <PublicMediaCard key={item.id} item={item} title={sermon.title} preacher={sermon.preacher} />
            ))}
          </motion.div>
        )}

        {/* Fallback fake player only when no media exists */}
        {media.length === 0 && <FakeAudioPlayer sermon={sermon} />}

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8"
        >
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
            <BookOpen className="size-5 text-[#004BA0]" />
            Overview
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            {sermon.description}
          </p>
        </motion.div>

        {/* Quotations */}
        {quotations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
              <Quote className="size-5 text-[#C60026]" />
              Key Scriptures
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The passages that anchor this message.
            </p>

            <div className="mt-6 space-y-5">
              {quotations.map((q, idx) => (
                <ScriptureCard key={idx} quotation={q} index={idx} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Back to all sermons button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <Link
            href="/sermons"
            className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-[#004BA0] hover:text-[#004BA0]"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to All Sermons
          </Link>
        </motion.div>

        {/* Bottom spacing for mobile */}
        <div className="h-8 sm:h-12" />
      </div>
    </div>
  );
}

// ─── Public Media Card (audio recording) ───────────────

function PublicMediaCard({ item, title, preacher }: { item: SermonMedia; title: string; preacher: string }) {
  const label = item.label || "Audio Recording";
  return <PublicAudioPlayer src={item.url} label={label} speaker={preacher} />;
}

// ─── Public Audio Player (real HTML5 audio) ──────────────────────────────────

function PublicAudioPlayer({ src, label, speaker }: { src: string; label: string; speaker: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onDur = () => { setDuration(a.duration || 0); setLoading(false); };
    const onPlay = () => { setPlaying(true); setLoading(false); };
    const onPause = () => setPlaying(false);
    const onWait = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("waiting", onWait);
    a.addEventListener("canplay", onCanPlay);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("waiting", onWait);
      a.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause(); else a.play().catch(() => {});
  }, [playing]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * duration;
    setCurrentTime(a.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-blue-500/5">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-4 bg-gradient-to-r from-[#004BA0] to-[#003578] p-4 text-white sm:p-5">
        <button
          onClick={togglePlay}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-[#004BA0] shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label={playing ? "Pause" : "Play"}
        >
          {loading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : playing ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="size-6 translate-x-0.5 fill-current" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Now Playing</div>
          <div className="truncate font-display text-base font-bold sm:text-lg">{label}</div>
          <div className="truncate text-xs text-blue-100">{speaker}</div>
        </div>
        <button
          onClick={() => {
            const a = audioRef.current;
            if (!a) return;
            a.muted = !a.muted;
            setMuted(!a.muted);
          }}
          className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:flex"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>
      <div className="px-4 py-4 sm:px-5">
        <div
          className="group relative h-2 cursor-pointer rounded-full bg-slate-200"
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#004BA0] to-[#4D9FFF] transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#004BA0] shadow-md transition-transform group-hover:scale-125"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => { const a = audioRef.current; if (a) a.currentTime = Math.max(0, a.currentTime - 15); }}
            className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#004BA0]"
            aria-label="Rewind 15 seconds"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            onClick={togglePlay}
            className="flex size-11 items-center justify-center rounded-full bg-[#EFF5FF] text-[#004BA0] transition-colors hover:bg-[#b3d0ff]"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 translate-x-0.5 fill-current" />
            )}
          </button>
          <button
            onClick={() => { const a = audioRef.current; if (a) a.currentTime = Math.min(a.duration || 0, a.currentTime + 15); }}
            className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#004BA0]"
            aria-label="Forward 15 seconds"
          >
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Public Video Player ─────────────────────────────────────────────────────

function PublicVideoPlayer({ src, label }: { src: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(v.duration || 0);
    const onPlay = () => { setPlaying(true); setLoading(false); };
    const onPause = () => setPlaying(false);
    const onWait = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWait);
    v.addEventListener("canplay", onCanPlay);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause(); else v.play().catch(() => {});
  }, [playing]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-lg relative">
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[60vh] object-contain"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />
      {/* Controls bar */}
      <div className="bg-gradient-to-r from-[#004BA0] to-[#003578] px-4 py-3 text-white">
        {label && <p className="text-[13px] font-semibold truncate mb-2">{label}</p>}
        <div className="mb-2">
          <div onClick={handleSeek} className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group">
            <div className="absolute top-0 left-0 h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progress}% - 6px)` }} />
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-white/70 font-mono">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 15); }} className="size-9 flex items-center justify-center rounded-full hover:bg-white/15 text-white" aria-label="Rewind">
              <SkipBack size={18} />
            </button>
            <button onClick={togglePlay} className="size-11 flex items-center justify-center rounded-full bg-white text-[#004BA0] hover:bg-white/90 active:scale-95 transition-all" aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
            </button>
            <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 15); }} className="size-9 flex items-center justify-center rounded-full hover:bg-white/15 text-white" aria-label="Forward">
              <SkipForward size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(!v.muted); }} className="size-8 flex items-center justify-center rounded-md hover:bg-white/15 text-white" aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button onClick={toggleFullscreen} className="size-8 flex items-center justify-center rounded-md hover:bg-white/15 text-white" aria-label="Fullscreen">
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public Image Viewer ────────────────────────────────────────────────────

function PublicImage({ imageSrc, label }: { imageSrc: string; label: string }) {
  const [lightbox, setLightbox] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <div
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm cursor-pointer group"
        onClick={() => setLightbox(true)}
      >
        <div className="relative bg-slate-50">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center min-h-[200px]">
              <Loader2 size={28} className="animate-spin text-slate-300" />
            </div>
          )}
          <img
            src={imageSrc}
            alt={label}
            className={cn("w-full max-h-[50vh] object-contain transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setLoaded(true)}
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-sm text-white font-medium">Click to view full size</p>
          </div>
        </div>
        {label && (
          <div className="p-4">
            <p className="font-semibold text-slate-900">{label}</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 transition-colors"
            onClick={() => setLightbox(false)}
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <img
            src={imageSrc}
            alt={label}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ─── Fake Audio Player (fallback when no media) ─────────────────────────────

function FakeAudioPlayer({ sermon }: { sermon: Sermon }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const duration = sermon.duration ?? 2880;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= duration) { setIsPlaying(false); return 0; }
          return p + 5;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, duration]);

  const pct = (progress / duration) * 100;
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-blue-500/5">
      <div className="flex items-center gap-4 bg-gradient-to-r from-[#004BA0] to-[#003578] p-4 text-white sm:p-5">
        <button
          onClick={() => setIsPlaying((v) => !v)}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-[#004BA0] shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="size-6 fill-current" /> : <Play className="size-6 translate-x-0.5 fill-current" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Now Playing</div>
          <div className="truncate font-display text-base font-bold">{sermon.title}</div>
          <div className="truncate text-xs text-blue-100">{sermon.preacher} · {sermon.scripture}</div>
        </div>
        <button
          onClick={() => setMuted((v) => !v)}
          className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:flex"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>
      <div className="px-4 py-4 sm:px-5">
        <div className="group relative h-2 cursor-pointer rounded-full bg-slate-200" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          setProgress(Math.max(0, Math.min(1, x)) * duration);
        }}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#004BA0] to-[#4D9FFF] transition-all" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#004BA0] shadow-md transition-transform group-hover:scale-125" style={{ left: `calc(${pct}% - 8px)` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button onClick={() => setProgress((p) => Math.max(0, p - 15))} className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#004BA0]" aria-label="Rewind 15 seconds"><SkipBack className="size-4" /></button>
          <button onClick={() => setIsPlaying((v) => !v)} className="flex size-11 items-center justify-center rounded-full bg-[#EFF5FF] text-[#004BA0] transition-colors hover:bg-[#b3d0ff]" aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-0.5 fill-current" />}</button>
          <button onClick={() => setProgress((p) => Math.min(duration, p + 15))} className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#004BA0]" aria-label="Forward 15 seconds"><SkipForward className="size-4" /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Scripture Card ─────────────────────────────────────────────────────────

function ScriptureCard({ quotation, index }: { quotation: Quotation; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-blue-500/10"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative flex shrink-0 items-center gap-2 sm:gap-3 bg-gradient-to-br from-[#004BA0] to-[#003578] p-3 sm:p-5 text-white sm:w-40 sm:flex-col sm:items-start sm:gap-2">
          <div className="absolute -right-6 -top-6 size-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-white/5" />
          <BookOpen className="relative size-5 text-blue-200" />
          <div className="relative font-display text-base sm:text-lg font-bold leading-tight">
            {quotation.reference}
          </div>
        </div>
        <div className="flex-1 p-4 sm:p-5">
          <Quote className="size-5 text-[#FFF0F2]" />
          <p className="mt-1 text-base sm:text-lg text-slate-700 leading-relaxed">
            {quotation.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
