"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";

/**
 * CACI Hub — Audio Player
 * A self-contained audio player with play/pause, seek bar, skip ±15s,
 * volume control, and loading state. Designed for sermon audio.
 */
export function AudioPlayer({
  src,
  title,
  speaker,
  className,
}: {
  src: string;
  title?: string;
  speaker?: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // Sync audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setLoading(false);
    };
    const onTime = () => setCurrent(audio.currentTime);
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play().catch(() => {});
  }, [playing]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(seconds, duration || 0));
    setCurrent(audio.currentTime);
  }, [duration]);

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    seek(audio.currentTime + delta);
  }, [seek]);

  const handleSeekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className={cn("rounded-xl bg-gradient-to-br from-caci-blue to-caci-blue-dim p-4 text-white shadow-sm", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Title row */}
      {(title || speaker) && (
        <div className="mb-3 min-w-0">
          {title && <p className="text-[14px] font-semibold truncate">{title}</p>}
          {speaker && <p className="text-[12px] text-white/70 truncate">{speaker}</p>}
        </div>
      )}

      {/* Seek bar */}
      <div className="mb-2">
        <div
          onClick={handleSeekBar}
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
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-white/70 font-mono">
          <span>{formatDuration(Math.floor(current))}</span>
          <span>{formatDuration(Math.floor(duration))}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => skip(-15)}
          className="size-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 transition-colors"
          aria-label="Skip back 15 seconds"
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
          onClick={() => skip(15)}
          className="size-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 transition-colors"
          aria-label="Skip forward 15 seconds"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Volume (desktop only) */}
      <div className="hidden md:flex items-center gap-2 mt-3 max-w-[160px] mx-auto">
        <button
          onClick={() => setMuted(!muted)}
          className="size-7 flex items-center justify-center rounded-md hover:bg-white/15 transition-colors shrink-0"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
          className="flex-1 h-1 accent-white cursor-pointer"
        />
      </div>
    </div>
  );
}
