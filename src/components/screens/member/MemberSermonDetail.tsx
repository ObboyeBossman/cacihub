"use client";

import { useEffect, useState } from "react";
import { BookOpen, Calendar, Mic, Music, Video, ExternalLink, Clock, Tag, Layers, Quote } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/format";
import {
  CACICard, CACISkeleton, EmptyState, CACIButton,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

export function MemberSermonDetail() {
  const { params, back } = useApp();
  const sermonId = params.sermonId;
  const [sermon, setSermon] = useState<SermonDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sermonId) { back(); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermons.get(sermonId);
        if (mounted) setSermon(res.sermon);
      } catch {} finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sermonId, back]);

  if (loading) {
    return (
      <>
        <MobileHeader title="Sermon" onBack={back} />
        <DesktopTopBar title="Sermon" />
        <div className="px-4 py-4 max-w-md mx-auto md:max-w-3xl space-y-4">
          <CACISkeleton className="h-48 w-full rounded-lg" />
          <CACICard>
            <CACISkeleton className="h-5 w-1/4 mb-3" />
            <CACISkeleton className="h-7 w-3/4 mb-2" />
            <CACISkeleton className="h-4 w-1/2 mb-4" />
            <CACISkeleton className="h-20 w-full" />
          </CACICard>
        </div>
      </>
    );
  }

  if (!sermon) {
    return (
      <>
        <MobileHeader title="Sermon" onBack={back} />
        <DesktopTopBar title="Sermon" />
        <EmptyState title="Sermon not found" action={<CACIButton onClick={back}>Go back</CACIButton>} />
      </>
    );
  }

  const hasMedia = !!(sermon.audioUrl || sermon.videoUrl);
  const hasQuotations = sermon.quotations?.length > 0;

  return (
    <>
      <MobileHeader title="Sermon" onBack={back} />
      <DesktopTopBar title={sermon.title} subtitle={`${sermon.speaker} · ${formatDate(sermon.date)}`} />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4 pb-8">

        {/* Hero cover */}
        <div className="h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-br from-caci-blue to-[#003578] flex items-center justify-center relative">
          {sermon.coverImageUrl ? (
            <img src={sermon.coverImageUrl} alt={sermon.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={56} className="text-white/80" />
          )}
          {/* Series badge overlay */}
          {sermon.seriesTitle && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
              <Layers size={11} />
              {sermon.seriesTitle}
              {sermon.sequence ? ` · #${sermon.sequence}` : ""}
            </div>
          )}
        </div>

        {/* Core info */}
        <CACICard padding="lg">
          <p className="text-[12px] text-caci-blue font-medium uppercase tracking-wide">{formatDate(sermon.date)}</p>
          <h1 className="text-[22px] font-bold text-n900 leading-tight mt-1">{sermon.title}</h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="flex items-center gap-1.5 text-[14px] text-n500">
              <Mic size={13} /> {sermon.speaker}
            </span>
            {sermon.durationSeconds ? (
              <span className="flex items-center gap-1.5 text-[13px] text-n400">
                <Clock size={13} /> {formatDuration(sermon.durationSeconds)}
              </span>
            ) : null}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {sermon.scriptureReference && (
              <span className="inline-flex items-center gap-1.5 bg-caci-blue-bg text-caci-blue px-3 py-1 rounded-md text-[13px] font-medium">
                📖 {sermon.scriptureReference}
              </span>
            )}
            {sermon.theme && (
              <span className="inline-flex items-center gap-1.5 bg-n100 text-n600 px-3 py-1 rounded-md text-[13px]">
                <Tag size={12} /> {sermon.theme}
              </span>
            )}
          </div>

          {sermon.description && (
            <div className="mt-4 text-[15px] text-n700 leading-relaxed whitespace-pre-wrap">
              {sermon.description}
            </div>
          )}
        </CACICard>

        {/* Listen / Watch */}
        {hasMedia && (
          <CACICard>
            <h3 className="text-[16px] font-semibold text-n900 mb-3">Listen / Watch</h3>
            <div className="space-y-2">
              {sermon.audioUrl && (
                <a
                  href={sermon.audioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-n100 hover:border-caci-blue transition-colors group"
                >
                  <div className="size-10 rounded-lg bg-caci-blue-bg text-caci-blue flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Music size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-n900">Audio Recording</p>
                    <p className="text-[12px] text-n400 truncate">
                      {sermon.durationSeconds ? formatDuration(sermon.durationSeconds) + " · " : ""}Listen to the message
                    </p>
                  </div>
                  <ExternalLink size={16} className="text-n400 shrink-0" />
                </a>
              )}
              {sermon.videoUrl && (
                <a
                  href={sermon.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-n100 hover:border-caci-red transition-colors group"
                >
                  <div className="size-10 rounded-lg bg-caci-red-bg text-caci-red flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Video size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-n900">Video Recording</p>
                    <p className="text-[12px] text-n400 truncate">Watch the message</p>
                  </div>
                  <ExternalLink size={16} className="text-n400 shrink-0" />
                </a>
              )}
            </div>
          </CACICard>
        )}

        {/* Quotations */}
        {hasQuotations && (
          <CACICard>
            <h3 className="text-[16px] font-semibold text-n900 mb-3">Notable Quotes</h3>
            <div className="space-y-4">
              {sermon.quotations.map((q, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    <Quote size={16} className="text-caci-blue/40" />
                  </div>
                  <div>
                    <p className="text-[14px] text-n700 leading-relaxed italic">{q.text}</p>
                    {q.reference && (
                      <p className="text-[12px] text-n400 mt-1 font-medium">— {q.reference}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CACICard>
        )}
      </div>
    </>
  );
}
