"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { SermonSeries } from "@/lib/sermons";
import { formatDate, formatDuration, formatDateShort } from "@/lib/sermons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSermonStore } from "@/store/sermons";
import { cn, normaliseCoverUrl } from "@/lib/utils";

interface SeriesDetailProps {
  series: SermonSeries;
}

export function SeriesDetail({ series }: SeriesDetailProps) {
  const goHome = useSermonStore((s) => s.goHome);
  const openSermon = useSermonStore((s) => s.openSermon);
  const isOngoing = series.status === "ongoing";

  return (
    <div className="min-h-screen bg-mesh-light">
      {/* Hero / cover */}
      <div className="relative h-[42vh] min-h-[320px] w-full overflow-hidden">
        {series.coverImage && (
          <img
            src={normaliseCoverUrl(series.coverImage)!}
            alt={series.title}
            className="size-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/60 to-[#004BA0]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#004BA0]/40 to-transparent" />

        {/* Back button */}
        <div className="absolute left-4 top-20 z-10 sm:left-6 lg:left-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button
              variant="ghost"
              onClick={goHome}
              className="gap-2 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Button>
          </motion.div>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Badge
                className={cn(
                  "gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  isOngoing
                    ? "bg-[#C60026] text-white"
                    : "bg-green-600 text-white"
                )}
              >
                {isOngoing ? (
                  <>
                    <span className="size-1.5 animate-pulse rounded-full bg-white" />
                    Ongoing Series
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3" />
                    Completed
                  </>
                )}
              </Badge>
              <Badge className="gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                <Calendar className="size-3" />
                {series.year}
              </Badge>
              <Badge className="gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                <BookOpen className="size-3" />
                {series.sermonCount} messages
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-3"
            >
              <div className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-blue-200">
                <Sparkles className="size-3.5 text-amber-300" />
                {series.theme}
              </div>
              <h1 className="mt-1 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                {series.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Left — description + sermons */}
          <div>
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                <BookOpen className="size-5 text-[#004BA0]" />
                About This Series
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                {series.description}
              </p>
              {series.anchorText && (
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#EFF5FF] px-4 py-3">
                  <BookOpen className="size-5 shrink-0 text-[#004BA0]" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#004BA0]">
                      Anchor Scripture
                    </div>
                    <div className="font-serif text-base font-semibold text-slate-800">
                      {series.anchorText}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Sermons list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Messages in This Series
                </h2>
                <span className="text-sm text-slate-500">
                  {series.sermons.length}{" "}
                  {series.sermons.length === 1 ? "message" : "messages"}
                </span>
              </div>

              <div className="space-y-3">
                {series.sermons.map((sermon, idx) => (
                  <motion.button
                    key={sermon.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.06 }}
                    whileHover={{ x: 4 }}
                    onClick={() => openSermon(sermon.id, series.id)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#004BA0]/30 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    {/* Sequence number */}
                    <div className="relative flex size-14 shrink-0 items-center justify-center">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#EFF5FF] to-[#b3d0ff]" />
                      <span className="relative font-display text-xl font-bold text-[#004BA0]">
                        {String(sermon.sequence).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-base font-bold text-slate-900 group-hover:text-[#004BA0]">
                        {sermon.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="size-3 text-[#004BA0]" />
                          {sermon.scripture}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <User className="size-3 text-[#004BA0]" />
                          {sermon.preacher}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3 text-[#004BA0]" />
                          {formatDateShort(sermon.datePreached)}
                        </span>
                        {sermon.duration && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3 text-[#004BA0]" />
                            {formatDuration(sermon.duration)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-xs font-medium text-[#C60026]">
                        {sermon.theme}
                      </div>
                    </div>

                    {/* Play button */}
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#004BA0] text-white shadow-md transition-all group-hover:scale-110 group-hover:bg-[#003578]">
                      <Play className="size-4 fill-current" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="sticky top-24 space-y-4"
            >
              {/* Series info card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900">
                  Series Info
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Theme</dt>
                    <dd className="font-medium text-slate-800">
                      {series.theme}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Year</dt>
                    <dd className="font-medium text-slate-800">
                      {series.year}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Messages</dt>
                    <dd className="font-medium text-slate-800">
                      {series.sermonCount}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Status</dt>
                    <dd
                      className={cn(
                        "font-medium",
                        isOngoing ? "text-[#C60026]" : "text-green-600"
                      )}
                    >
                      {isOngoing ? "Ongoing" : "Completed"}
                    </dd>
                  </div>
                  {series.startDate && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Started</dt>
                      <dd className="font-medium text-slate-800">
                        {formatDate(series.startDate)}
                      </dd>
                    </div>
                  )}
                  {series.endDate && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Ended</dt>
                      <dd className="font-medium text-slate-800">
                        {formatDate(series.endDate)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* CTA */}
              {series.sermons.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-[#004BA0] to-[#003578] p-5 text-white shadow-lg">
                  <h3 className="font-display text-base font-bold">
                    Start Listening
                  </h3>
                  <p className="mt-1 text-sm text-blue-100">
                    Begin with message 1 and journey through the whole series.
                  </p>
                  <Button
                    onClick={() =>
                      openSermon(series.sermons[0].id, series.id)
                    }
                    className="mt-4 w-full gap-2 bg-white text-[#004BA0] hover:bg-blue-50"
                  >
                    <Play className="size-4 fill-current" />
                    Play First Message
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
