"use client";

import { useEffect, useState } from "react";
import {
  BookOpen, Calendar, Mic, ChevronRight, CheckCircle2,
  Radio, Tag, Clock,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonSeriesWithSermons, SermonDTO } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/format";
import {
  CACICard, CACISkeleton, EmptyState, CACIButton,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

export function MemberSermonSeriesDetail() {
  const { params, back, navigate, setParam } = useApp();
  const seriesId = params.seriesId;
  const [series, setSeries] = useState<SermonSeriesWithSermons | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seriesId) { back(); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermonSeries.getWithSermons(seriesId);
        if (mounted) setSeries(res.series);
      } catch {
        if (mounted) setSeries(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [seriesId, back]);

  function openSermon(sermonId: string) {
    setParam("sermonId", sermonId);
    navigate("member-sermon-detail");
  }

  if (loading) {
    return (
      <>
        <MobileHeader title="Series" onBack={back} />
        <DesktopTopBar title="Sermon Series" />
        <div className="px-4 py-4 max-w-md mx-auto md:max-w-3xl space-y-4">
          <CACISkeleton className="h-52 w-full rounded-xl" />
          <CACICard>
            <CACISkeleton className="h-6 w-2/3 mb-2" />
            <CACISkeleton className="h-4 w-1/2 mb-4" />
            <CACISkeleton className="h-16 w-full" />
          </CACICard>
          {[0, 1, 2].map((i) => (
            <CACICard key={i} padding="none">
              <div className="p-4 space-y-2">
                <CACISkeleton className="h-4 w-3/4" />
                <CACISkeleton className="h-3 w-1/2" />
              </div>
            </CACICard>
          ))}
        </div>
      </>
    );
  }

  if (!series) {
    return (
      <>
        <MobileHeader title="Series" onBack={back} />
        <DesktopTopBar title="Sermon Series" />
        <EmptyState
          title="Series not found"
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  const isOngoing = series.status === "ongoing";

  return (
    <>
      <MobileHeader title={series.title} onBack={back} />
      <DesktopTopBar
        title={series.title}
        subtitle={`${series.sermons.length} messages · ${series.year}`}
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4 pb-10">

        {/* Hero cover */}
        <div className="relative h-52 md:h-64 rounded-xl overflow-hidden flex items-end">
          {series.coverImage ? (
            <img
              src={series.coverImage}
              alt={series.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-caci-blue to-[#002a5e]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />

          {/* Scripture watermark */}
          {series.anchorText && (
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
            >
              <span
                className="text-white/[0.045] font-bold leading-none select-none text-center px-4"
                style={{ fontSize: "clamp(3rem, 12vw, 7rem)", wordBreak: "break-word" }}
              >
                {series.anchorText}
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              {series.year}
            </span>
            {isOngoing ? (
              <span className="inline-flex items-center gap-1.5 bg-caci-red text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
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

          <div className="relative p-4 w-full">
            {series.theme && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200 mb-1">
                {series.theme}
              </p>
            )}
            <h1 className="text-[22px] font-bold text-white leading-snug">{series.title}</h1>
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
        </div>

        {/* About */}
        {(series.description || series.anchorText) && (
          <CACICard padding="lg">
            {series.anchorText && (
              <div className="flex items-start gap-2.5 bg-caci-blue-bg rounded-lg px-3 py-2.5 mb-3">
                <BookOpen size={14} className="text-caci-blue shrink-0 mt-0.5" />
                <span className="text-[14px] text-caci-blue font-medium italic leading-relaxed">
                  {series.anchorText}
                </span>
              </div>
            )}
            {series.description && (
              <p className="text-[14px] text-n600 leading-relaxed">{series.description}</p>
            )}
            {series.theme && (
              <div className="flex items-center gap-1.5 mt-3 text-[13px] text-n400">
                <Tag size={12} />
                <span>{series.theme}</span>
              </div>
            )}
          </CACICard>
        )}

        {/* Messages list */}
        <div>
          <h2 className="text-[16px] font-semibold text-n900 mb-3">
            Messages ({series.sermons.length})
          </h2>

          {series.sermons.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={22} />}
              title="No messages yet"
              description="Messages will appear here as they are added."
            />
          ) : (
            <div className="space-y-2">
              {series.sermons.map((sermon, idx) => (
                <SermonRow
                  key={sermon.id}
                  sermon={sermon}
                  index={idx + 1}
                  onClick={() => openSermon(sermon.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SermonRow({
  sermon,
  index,
  onClick,
}: {
  sermon: SermonDTO;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-n100 hover:border-caci-blue bg-white transition-colors group text-left"
    >
      {/* Index number */}
      <div className="size-9 rounded-lg bg-caci-blue-bg flex items-center justify-center shrink-0">
        <span className="text-[13px] font-bold text-caci-blue">{index}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-n900 truncate leading-snug">
          {sermon.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[12px] text-n400">
            <Mic size={11} />
            {sermon.speaker}
          </span>
          <span className="text-n200">·</span>
          <span className="inline-flex items-center gap-1 text-[12px] text-n400">
            <Calendar size={11} />
            {formatDate(sermon.date)}
          </span>
          {sermon.durationSeconds && (
            <>
              <span className="text-n200">·</span>
              <span className="inline-flex items-center gap-1 text-[12px] text-n400">
                <Clock size={11} />
                {formatDuration(sermon.durationSeconds)}
              </span>
            </>
          )}
        </div>
        {sermon.scriptureReference && (
          <p className="text-[11px] text-caci-blue mt-0.5 italic truncate">
            {sermon.scriptureReference}
          </p>
        )}
      </div>

      <ChevronRight
        size={16}
        className="text-n300 shrink-0 group-hover:text-caci-blue transition-colors"
      />
    </button>
  );
}
