"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Maximize2, Loader2, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function InlineVideoPlayer({ src, label, description }: { src: string; label: string; description?: string | null }) {
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

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(!v.muted);
  }, [muted]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen().catch(() => {});
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div ref={containerRef} className="rounded-xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[60vh] object-contain"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />
      <div className="bg-gradient-to-r from-caci-blue to-caci-blue-dim px-4 py-3">
        {label && (
          <p className="text-[13px] font-semibold text-white truncate mb-2">{label}</p>
        )}
        <div className="mb-2">
          <div
            onClick={handleSeek}
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group"
          >
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-white/70 font-mono">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 15); }}
            className="size-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 transition-colors text-white"
            aria-label="Rewind 15 seconds"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            className="size-12 flex items-center justify-center rounded-full bg-white text-caci-blue hover:bg-white/90 active:scale-95 transition-all shadow-md"
            aria-label={playing ? "Pause" : "Play"}
          >
            {loading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : playing ? (
              <Pause size={22} className="fill-current" />
            ) : (
              <Play size={22} className="fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 15); }}
            className="size-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 transition-colors text-white"
            aria-label="Forward 15 seconds"
          >
            <SkipForward size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={toggleMute}
            className="size-8 flex items-center justify-center rounded-md hover:bg-white/15 transition-colors text-white"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="size-8 flex items-center justify-center rounded-md hover:bg-white/15 transition-colors text-white"
            aria-label="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
        {description && (
          <p className="text-[11px] text-white/60 mt-2 line-clamp-1">{description}</p>
        )}
      </div>
    </div>
  );
}

export function InlineImage({ imageSrc, label, description }: { imageSrc: string; label: string; description?: string | null }) {
  const [lightbox, setLightbox] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <div
        className="rounded-xl overflow-hidden border border-n100 cursor-pointer group"
        onClick={() => setLightbox(true)}
      >
        <div className="relative bg-n50">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-n300" />
            </div>
          )}
          <img
            src={imageSrc}
            alt={label}
            className={cn(
              "w-full max-h-[50vh] object-contain transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setLoaded(true)}
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[12px] text-white font-medium">Tap to view full size</p>
          </div>
        </div>
        {(label || description) && (
          <div className="p-3">
            {label && <p className="text-[14px] font-semibold text-n900">{label}</p>}
            {description && <p className="text-[12px] text-n500 mt-0.5 line-clamp-2">{description}</p>}
          </div>
        )}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
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
