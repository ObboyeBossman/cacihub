"use client";

import { motion } from "framer-motion";
import { BookOpen, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import type { SermonSeries } from "@/lib/sermons";
import { useSermonStore } from "@/store/sermons";
import { formatDateShort } from "@/lib/sermons";
import { cn } from "@/lib/utils";

interface SeriesCardProps {
  series: SermonSeries;
  index: number;
}

export function SeriesCard({ series, index }: SeriesCardProps) {
  const openSeries = useSermonStore((s) => s.openSeries);
  const isOngoing = series.status === "ongoing";

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
      whileHover={{ y: -6 }}
      onClick={() => openSeries(series.id)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-blue-500/10"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {series.coverImage ? (
          <img
            src={series.coverImage}
            alt={series.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-[#004BA0] to-[#003578]" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status badge */}
        <div className="absolute right-3 top-3">
          {isOngoing ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C60026] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Ongoing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-lg backdrop-blur-sm">
              <CheckCircle2 className="size-3 text-green-600" />
              Completed
            </span>
          )}
        </div>

        {/* Year badge */}
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {series.year}
          </span>
        </div>

        {/* Bottom title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
            {series.theme}
          </div>
          <h3 className="mt-1 font-display text-xl font-bold leading-tight text-white">
            {series.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
          {series.description}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-[#004BA0]" />
            {series.sermonCount} messages
          </span>
          {series.startDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#004BA0]" />
              {formatDateShort(series.startDate)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-400">
            {series.anchorText ?? "—"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold text-[#004BA0] transition-all",
              "group-hover:gap-2"
            )}
          >
            Explore
            <ChevronRight className="size-3.5" />
          </span>
        </div>
      </div>

      {/* Hover gradient border glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-2 ring-[#004BA0]/0 transition-all duration-300 group-hover:opacity-100 group-hover:ring-[#004BA0]/20" />
    </motion.button>
  );
}
