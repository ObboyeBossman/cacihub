"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, User, BookOpen, Play, Volume2, Download, ArrowRight } from "lucide-react";
import type { Sermon } from "@/lib/sermons";
import { formatDateShort } from "@/lib/sermons";
import Link from "next/link";

interface SermonsCatalogProps {
  sermons: Sermon[];
}

export function SermonsCatalog({ sermons }: SermonsCatalogProps) {
  const [search, setSearch] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState("all");

  const speakers = useMemo(() => {
    const set = new Set<string>();
    sermons.forEach((s) => {
      if (s.preacher) set.add(s.preacher);
    });
    return Array.from(set).sort();
  }, [sermons]);

  const filteredSermons = useMemo(() => {
    return sermons.filter((s) => {
      const matchSearch =
        search.trim() === "" ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.preacher.toLowerCase().includes(search.toLowerCase()) ||
        s.scripture.toLowerCase().includes(search.toLowerCase()) ||
        s.theme.toLowerCase().includes(search.toLowerCase());

      const matchSpeaker = speakerFilter === "all" || s.preacher === speakerFilter;

      return matchSearch && matchSpeaker;
    });
  }, [sermons, search, speakerFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Filters Bar */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sermons by title, speaker, scripture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-caci-blue focus:outline-none focus:ring-2 focus:ring-caci-blue/20"
          />
        </div>

        {speakers.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="speaker-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Preacher:
            </label>
            <select
              id="speaker-select"
              value={speakerFilter}
              onChange={(e) => setSpeakerFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-caci-blue focus:outline-none"
            >
              <option value="all">All Speakers ({sermons.length})</option>
              {speakers.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredSermons.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <BookOpen className="mx-auto size-10 text-slate-300" />
          <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
            No sermons found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search terms or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSermons.map((sermon, idx) => {
            const hasAudio = sermon.media.some((m) => m.type === "audio");
            const hasVideo = sermon.media.some((m) => m.type === "video");
            const hasPdf = sermon.media.some((m) => m.type === "pdf" || m.type === "text");

            return (
              <motion.div
                key={sermon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-caci-blue/30 hover:shadow-xl"
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-caci-blue">
                      {sermon.theme || "Sermon"}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {hasVideo && <Play className="size-3.5 text-rose-500" />}
                      {hasAudio && <Volume2 className="size-3.5 text-blue-500" />}
                      {hasPdf && <Download className="size-3.5 text-amber-500" />}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 font-display text-xl font-bold leading-snug text-slate-900 group-hover:text-caci-blue transition-colors">
                    <Link href={`/sermons/sermon/${sermon.id}`}>
                      {sermon.title}
                    </Link>
                  </h3>

                  {/* Scripture */}
                  {sermon.scripture && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                      <BookOpen className="size-3.5" />
                      {sermon.scripture}
                    </div>
                  )}

                  {/* Summary */}
                  {sermon.summary && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {sermon.summary}
                    </p>
                  )}
                </div>

                {/* Footer info */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <User className="size-3.5 text-slate-400" />
                      {sermon.preacher}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Calendar className="size-3.5" />
                      {formatDateShort(sermon.datePreached)}
                    </div>
                  </div>

                  <Link
                    href={`/sermons/sermon/${sermon.id}`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-caci-blue transition-colors group-hover:bg-caci-blue group-hover:text-white"
                  >
                    Listen / Read Message
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
