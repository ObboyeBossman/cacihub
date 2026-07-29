"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import type { Sermon, SermonSummary, SermonSeries, Quotation } from "@/lib/sermons";
import { parseQuotations, formatDate, formatDuration, formatDateShort } from "@/lib/sermons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSermonStore } from "@/store/sermons";
import { useSermonDetail } from "@/hooks/use-sermons";
import { cn } from "@/lib/utils";

interface SermonDetailProps {
  sermonId: string;
  seriesId?: string;
  series?: SermonSeries | null;
}

export function SermonDetail({ sermonId, seriesId, series }: SermonDetailProps) {
  const goHome = useSermonStore((s) => s.goHome);
  const openSeries = useSermonStore((s) => s.openSeries);
  const openSermon = useSermonStore((s) => s.openSermon);
  const { data, loading } = useSermonDetail(sermonId);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-mesh-light">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="mt-8 h-12 w-3/4" />
          <Skeleton className="mt-4 h-6 w-1/2" />
          <Skeleton className="mt-8 h-64 w-full" />
          <Skeleton className="mt-6 h-48 w-full" />
        </div>
      </div>
    );
  }

  const { sermon, prev, next, siblings } = data;
  const quotations = parseQuotations(sermon.quotations);
  const activeSeries = series ?? sermon.series;

  return (
    <div className="min-h-screen bg-mesh-light">
      {/* Top bar */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={() => openSeries(activeSeries.id)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#004BA0]"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to</span>
            <span className="max-w-[200px] truncate font-semibold">
              {activeSeries.title}
            </span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>
              Message {sermon.sequence} of {siblings.length}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
              {activeSeries.title}
            </Badge>
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
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

        {/* Audio player */}
        <AudioPlayer sermon={sermon} />

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
            <BookOpen className="size-5 text-[#004BA0]" />
            Overview
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600 drop-cap">
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

        {/* Prev / Next navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 grid gap-4 sm:grid-cols-2"
        >
          {prev ? (
            <button
              onClick={() => openSermon(prev.id, activeSeries.id)}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#004BA0]/30 hover:shadow-lg"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-[#004BA0] group-hover:text-white">
                <ChevronLeft className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Previous · {String(prev.sequence).padStart(2, "0")}
                </div>
                <div className="truncate font-semibold text-slate-800 group-hover:text-[#004BA0]">
                  {prev.title}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {prev.scripture}
                </div>
              </div>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {next ? (
            <button
              onClick={() => openSermon(next.id, activeSeries.id)}
              className="group flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm transition-all hover:border-[#004BA0]/30 hover:shadow-lg"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Next · {String(next.sequence).padStart(2, "0")}
                </div>
                <div className="truncate font-semibold text-slate-800 group-hover:text-[#004BA0]">
                  {next.title}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {next.scripture}
                </div>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-[#004BA0] group-hover:text-white">
                <ChevronRight className="size-5" />
              </div>
            </button>
          ) : (
            <button
              onClick={() => openSeries(activeSeries.id)}
              className="group flex items-center justify-end gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-right transition-all hover:border-[#C60026]/40 hover:bg-red-50"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  End of Series
                </div>
                <div className="font-semibold text-slate-700 group-hover:text-[#C60026]">
                  Back to {activeSeries.title}
                </div>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition-colors group-hover:bg-[#C60026] group-hover:text-white">
                <ChevronRight className="size-5" />
              </div>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function ScriptureCard({
  quotation,
  index,
}: {
  quotation: Quotation;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-blue-500/10"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Reference sidebar */}
        <div className="relative flex shrink-0 items-center gap-3 bg-gradient-to-br from-[#004BA0] to-[#003578] p-5 text-white sm:w-48 sm:flex-col sm:items-start sm:gap-2">
          <div className="absolute -right-6 -top-6 size-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-white/5" />
          <BookOpen className="relative size-5 text-blue-200" />
          <div className="relative font-display text-lg font-bold leading-tight">
            {quotation.reference}
          </div>
        </div>

        {/* Verse text */}
        <div className="flex-1 p-5">
          <Quote className="size-6 text-[#FFF0F2]" />
          <p className="scripture-text mt-1 text-lg text-slate-700">
            {quotation.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function AudioPlayer({ sermon }: { sermon: Sermon }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const duration = sermon.duration ?? 2880;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return p + 5;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, duration]);

  const pct = (progress / duration) * 100;
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-blue-500/5"
    >
      <div className="flex items-center gap-4 bg-gradient-to-r from-[#004BA0] to-[#003578] p-4 text-white sm:p-5">
        <button
          onClick={() => setIsPlaying((v) => !v)}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-[#004BA0] shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="size-6 translate-x-0.5 fill-current" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
            Now Playing
          </div>
          <div className="truncate font-display text-base font-bold">
            {sermon.title}
          </div>
          <div className="truncate text-xs text-blue-100">
            {sermon.preacher} · {sermon.scripture}
          </div>
        </div>

        <button
          onClick={() => setMuted((v) => !v)}
          className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:flex"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-4 sm:px-5">
        <div
          className="group relative h-2 cursor-pointer rounded-full bg-slate-200"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            setProgress(Math.max(0, Math.min(1, x)) * duration);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#004BA0] to-[#4D9FFF] transition-all"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#004BA0] shadow-md transition-transform group-hover:scale-125"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => setProgress((p) => Math.max(0, p - 15))}
            className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#004BA0]"
            aria-label="Rewind 15 seconds"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            onClick={() => setIsPlaying((v) => !v)}
            className="flex size-11 items-center justify-center rounded-full bg-[#EFF5FF] text-[#004BA0] transition-colors hover:bg-[#b3d0ff]"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 translate-x-0.5 fill-current" />
            )}
          </button>
          <button
            onClick={() =>
              setProgress((p) => Math.min(duration, p + 15))
            }
            className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#004BA0]"
            aria-label="Forward 15 seconds"
          >
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
