"use client";

import { useEffect, useState } from "react";
import {
  BookOpen, Search, CheckCircle2, ChevronRight, Layers,
  Calendar, Mic, Radio,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonSeriesWithSermons } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  CACICard, CACISkeleton, EmptyState, CACIInput,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { normaliseCoverUrl } from "@/lib/utils";

// ─── Signature design move ───────────────────────────────────────────────────
// Each series card has a "scripture watermark": the anchorText rendered at
// massive size behind the cover gradient, clipped and near-invisible — present
// as ambient texture, not content. Communicates sacred weight without clutter.
// ─────────────────────────────────────────────────────────────────────────────

export function MemberSermons() {
  const { navigate, setParam } = useApp();
  const [allSeries, setAllSeries] = useState<SermonSeriesWithSermons[] | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermonSeries.listWithSermons();
        if (mounted) setAllSeries(res.series);
      } catch {
        if (mounted) setAllSeries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = (allSeries || []).filter((s) =>
    !q ||
    s.title.toLowerCase().includes(q) ||
    (s.theme || "").toLowerCase().includes(q) ||
    (s.description || "").toLowerCase().includes(q) ||
    s.sermons.some(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.speaker.toLowerCase().includes(q) ||
        (m.scriptureReference || "").toLowerCase().includes(q),
    ),
  );

  const ongoingCount = (allSeries || []).filter((s) => s.status === "ongoing").length;
  const totalSermons = (allSeries || []).reduce((acc, s) => acc + s.sermons.length, 0);

  function openSeries(id: string) {
    setParam("seriesId", id);
    navigate("member-sermon-series");
  }

  function openSermon(sermonId: string) {
    setParam("sermonId", sermonId);
    navigate("member-sermon-detail");
  }

  return (
    <>
      <MobileHeader
        title="Sermons"
        subtitle={
          allSeries
            ? `${allSeries.length} series · ${totalSermons} messages`
            : "Loading…"
        }
      />
      <DesktopTopBar
        title="Sermons"
        subtitle="Listen to messages from your assembly"
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-5xl">

        {/* Search */}
        <div className="mb-5">
          <CACIInput
            placeholder="Search series, speakers, scriptures…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search size={18} />}
            containerClassName="mb-0"
          />
        </div>

        {/* Summary strip */}
        {!loading && !q && allSeries && allSeries.length > 0 && (
          <div className="mb-5 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {ongoingCount > 0 && (
              <div className="flex items-center gap-2 shrink-0 bg-caci-red-bg border border-[#ffc9d2] text-caci-red rounded-full px-3 py-1.5 text-[13px] font-medium">
                <span className="size-2 rounded-full bg-caci-red animate-pulse-loading" />
                {ongoingCount} ongoing
              </div>
            )}
            <div className="flex items-center gap-2 shrink-0 bg-caci-blue-bg text-caci-blue rounded-full px-3 py-1.5 text-[13px] font-medium">
              <Layers size={13} />
              {(allSeries || []).length} series
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-n100 text-n500 rounded-full px-3 py-1.5 text-[13px] font-medium">
              <BookOpen size={13} />
              {totalSermons} messages
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <CACICard key={i} padding="none" className="overflow-hidden">
                <CACISkeleton className="h-44 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <CACISkeleton className="h-5 w-2/3" />
                  <CACISkeleton className="h-4 w-1/2" />
                  <CACISkeleton className="h-3 w-3/4" />
                </div>
              </CACICard>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<BookOpen size={26} />}
            title={q ? "No series match your search" : "No sermon series yet"}
            description={
              q
                ? "Try a different search term."
                : "Check back soon for recorded messages."
            }
          />
        )}

        {/* Series cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((series) => (
              <SeriesCard
                key={series.id}
                series={series}
                onOpen={() => openSeries(series.id)}
                onOpenSermon={openSermon}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Series card ─────────────────────────────────────────────────────────────

function SeriesCard({
  series,
  onOpen,
  onOpenSermon,
}: {
  series: SermonSeriesWithSermons;
  onOpen: () => void;
  onOpenSermon: (id: string) => void;
}) {
  const isOngoing = series.status === "ongoing";
  const latestSermon = series.sermons.length > 0
    ? series.sermons[series.sermons.length - 1]
    : null;

  return (
    <CACICard padding="none" className="overflow-hidden">
      {/* Cover hero */}
      <button
        onClick={onOpen}
        className="relative w-full h-44 md:h-52 overflow-hidden flex items-end text-left focus-visible:outline-2 focus-visible:outline-caci-blue"
      >
        {/* Background */}
        {series.coverImage ? (
          <img
            src={normaliseCoverUrl(series.coverImage)!}
            alt={series.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-caci-blue to-[#002a5e]" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />

        {/* Scripture watermark — signature move */}
        {series.anchorText && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
          >
            <span
              className="text-white/[0.045] font-bold leading-none select-none text-center px-4"
              style={{ fontSize: "clamp(2.5rem, 10vw, 6rem)", wordBreak: "break-word" }}
            >
              {series.anchorText}
            </span>
          </div>
        )}

        {/* Status + year badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
            {series.year}
          </span>
          {isOngoing ? (
            <span className="inline-flex items-center gap-1.5 bg-caci-red text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              <Radio size={9} className="animate-pulse-loading" />
              Ongoing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-white/85 backdrop-blur-sm text-n700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              <CheckCircle2 size={11} className="text-[#1a7f37]" />
              Completed
            </span>
          )}
        </div>

        {/* Title block */}
        <div className="relative p-4 w-full">
          {series.theme && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200 mb-1">
              {series.theme}
            </p>
          )}
          <h3 className="text-[20px] font-bold text-white leading-snug">{series.title}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[12px] text-white/70">
              <BookOpen size={11} />
              {series.sermons.length} {series.sermons.length === 1 ? "message" : "messages"}
            </span>
            {series.startDate && (
              <span className="inline-flex items-center gap-1 text-[12px] text-white/70">
                <Calendar size={11} />
                {formatDate(series.startDate)}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Body */}
      <div className="p-4">
        {series.description && (
          <p className="text-[14px] text-n500 leading-relaxed line-clamp-2 mb-3">
            {series.description}
          </p>
        )}

        {series.anchorText && (
          <div className="flex items-center gap-2.5 bg-caci-blue-bg rounded-lg px-3 py-2 mb-3">
            <BookOpen size={14} className="text-caci-blue shrink-0" />
            <span className="text-[13px] text-caci-blue font-medium italic">{series.anchorText}</span>
          </div>
        )}

        {/* Latest message preview */}
        {latestSermon && (
          <button
            onClick={() => onOpenSermon(latestSermon.id)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-n100 hover:border-caci-blue transition-colors group mb-3"
          >
            <div className="size-9 rounded-lg bg-caci-blue-bg flex items-center justify-center shrink-0">
              <Mic size={15} className="text-caci-blue" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[11px] text-n400 mb-0.5">Latest message</p>
              <p className="text-[14px] font-semibold text-n900 truncate leading-snug">
                {latestSermon.title}
              </p>
              <p className="text-[12px] text-n400">
                {latestSermon.speaker} · {formatDate(latestSermon.date)}
              </p>
            </div>
            <ChevronRight size={16} className="text-n300 shrink-0 group-hover:text-caci-blue transition-colors" />
          </button>
        )}

        {/* View all */}
        <button
          onClick={onOpen}
          className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold text-caci-blue hover:text-[#003578] transition-colors py-1"
        >
          View all messages
          <ChevronRight size={15} />
        </button>
      </div>
    </CACICard>
  );
}
