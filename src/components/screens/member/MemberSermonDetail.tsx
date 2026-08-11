"use client";

import { useEffect, useState } from "react";
import {
  BookOpen, Calendar, Mic, Music, Video, FileText, ImageIcon,
  Clock, Tag, Layers, Quote, Presentation,
  ChevronLeft, ChevronRight, ArrowLeft, ExternalLink,
  FolderArchive, Volume2, Play,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO, SermonMediaDTO, SermonMediaType } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CACICard, CACISkeleton, EmptyState, CACIButton,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { AudioPlayer } from "@/components/audio-player";
import { ShareButton } from "@/components/caci/share-button";
import { InlineVideoPlayer, InlineImage } from "./SermonMediaPlayers";

// ── Media config ──────────────────────────────────────────────
const MEDIA_CFG: Record<SermonMediaType, {
  icon: React.ReactNode;
  iconLg: React.ReactNode;
  bg: string;
  text: string;
  border: string;
  hoverBorder: string;
  defaultLabel: string;
  defaultSub: (s: SermonDTO) => string;
}> = {
  audio: {
    icon:   <Music size={16} />,
    iconLg: <Music size={20} />,
    bg: "bg-blue-50", text: "text-caci-blue",
    border: "border-blue-100", hoverBorder: "hover:border-caci-blue",
    defaultLabel: "Audio Recording",
    defaultSub: (s) => s.durationSeconds ? `${formatDuration(s.durationSeconds)} · Listen to the message` : "Listen to the message",
  },
  video: {
    icon:   <Video size={16} />,
    iconLg: <Video size={20} />,
    bg: "bg-purple-50", text: "text-purple-600",
    border: "border-purple-100", hoverBorder: "hover:border-purple-400",
    defaultLabel: "Video Recording",
    defaultSub: () => "Watch the full message",
  },
  document: {
    icon:   <FileText size={16} />,
    iconLg: <FileText size={20} />,
    bg: "bg-rose-50", text: "text-caci-red",
    border: "border-rose-100", hoverBorder: "hover:border-rose-400",
    defaultLabel: "Document",
    defaultSub: () => "Open document",
  },
  image: {
    icon:   <ImageIcon size={16} />,
    iconLg: <ImageIcon size={20} />,
    bg: "bg-emerald-50", text: "text-emerald-600",
    border: "border-emerald-100", hoverBorder: "hover:border-emerald-400",
    defaultLabel: "Image",
    defaultSub: () => "View image",
  },
  slides: {
    icon:   <Presentation size={16} />,
    iconLg: <Presentation size={20} />,
    bg: "bg-amber-50", text: "text-amber-600",
    border: "border-amber-100", hoverBorder: "hover:border-amber-400",
    defaultLabel: "Slides",
    defaultSub: () => "View presentation slides",
  },
};

// ── Media Card ────────────────────────────────────────────────
function MediaCard({ item, sermon }: { item: SermonMediaDTO; sermon: SermonDTO }) {
  const cfg = MEDIA_CFG[item.type as SermonMediaType] ?? MEDIA_CFG.audio;
  const label = item.label || cfg.defaultLabel;
  const sub   = cfg.defaultSub(sermon);

  if (item.type === "audio") {
    return (
      <div className="space-y-1.5">
        <AudioPlayer src={item.url} title={label} speaker={sermon.speaker} />
        {item.description && <p className="text-[12px] text-n500 px-1 line-clamp-2">{item.description}</p>}
      </div>
    );
  }

  if (item.type === "video") {
    return <InlineVideoPlayer src={item.url} label={label} description={item.description} />;
  }

  if (item.type === "image") {
    return <InlineImage imageSrc={item.url} label={label} description={item.description} />;
  }

  // Document / slides — open in new tab
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-n100 transition-all duration-150 group active:scale-[0.98]",
        cfg.hoverBorder,
      )}
    >
      <div className={cn("size-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-150", cfg.bg, cfg.text)}>
        {cfg.iconLg}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-n900">{label}</p>
        <p className="text-[12px] text-n400 mt-0.5">{sub}</p>
        {item.description && <p className="text-[12px] text-n500 mt-0.5 line-clamp-2">{item.description}</p>}
      </div>
      <ExternalLink size={15} className="text-n300 shrink-0 group-hover:text-n600 transition-colors" />
    </a>
  );
}

// ── MemberSermonDetail ────────────────────────────────────────
export function MemberSermonDetail() {
  const { params, back, navigate, setParam } = useApp();
  const sermonId = params.sermonId;

  const [sermon, setSermon]     = useState<SermonDTO | null>(null);
  const [siblings, setSiblings] = useState<SermonDTO[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!sermonId) { back(); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermons.get(sermonId);
        if (!mounted) return;
        setSermon(res.sermon);
        if (res.sermon.seriesId) {
          try {
            const sibRes = await api.sermons.list(res.sermon.seriesId);
            if (mounted) setSiblings(sibRes.sermons);
          } catch { /* non-fatal */ }
        }
      } catch { /* handled via sermon === null */ } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sermonId, back]);

  function goToSermon(id: string) {
    setParam("sermonId", id);
    navigate("member-sermon-detail");
  }

  function goToSeries() {
    if (sermon?.seriesId) {
      setParam("seriesId", sermon.seriesId);
      navigate("member-sermon-series");
    } else {
      back();
    }
  }

  // ── Loading ─────────────────────────────────
  if (loading) {
    return (
      <>
        <MobileHeader title="Sermon" onBack={back} />
        <DesktopTopBar title="Sermon" />
        <div className="px-4 py-4 max-w-md mx-auto md:max-w-3xl space-y-4">
          <CACISkeleton className="h-56 w-full rounded-2xl" />
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

  const media         = [...(sermon.media ?? [])].sort((a, b) => a.sequence - b.sequence);
  const hasMedia      = media.length > 0;
  const hasQuotations = sermon.quotations?.length > 0;

  const siblingIdx = siblings.findIndex(s => s.id === sermon.id);
  const prev = siblingIdx > 0 ? siblings[siblingIdx - 1] : null;
  const next = siblingIdx >= 0 && siblingIdx < siblings.length - 1 ? siblings[siblingIdx + 1] : null;
  const messageLabel = siblingIdx >= 0 ? `Message ${siblingIdx + 1} of ${siblings.length}` : null;

  const audioCt = media.filter(m => m.type === "audio").length;
  const videoCt = media.filter(m => m.type === "video").length;

  return (
    <>
      <MobileHeader
        title="Sermon"
        onBack={sermon.seriesId ? goToSeries : back}
        action={
          <ShareButton
            path={`/sermons/sermon/${sermon.id}`}
            title={sermon.title}
            description={sermon.description || `${sermon.speaker} - ${sermon.seriesTitle || "Sermon"}`}
            coverImageUrl={sermon.coverImageUrl || undefined}
            size="sm"
          />
        }
      />
      <DesktopTopBar
        title={sermon.title}
        subtitle={sermon.seriesTitle ? `${sermon.seriesTitle} · ${formatDate(sermon.date)}` : formatDate(sermon.date)}
        action={
          <ShareButton
            path={`/sermons/sermon/${sermon.id}`}
            title={sermon.title}
            description={sermon.description || `${sermon.speaker} - ${sermon.seriesTitle || "Sermon"}`}
            coverImageUrl={sermon.coverImageUrl || undefined}
          />
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4 pb-10">

        {/* Series breadcrumb */}
        {sermon.seriesTitle && (
          <button
            onClick={goToSeries}
            className="flex items-center gap-2 text-[13px] text-caci-blue font-medium hover:underline"
          >
            <ArrowLeft size={14} />
            <span className="truncate">{sermon.seriesTitle}</span>
            {messageLabel && <span className="text-n400 font-normal shrink-0">· {messageLabel}</span>}
          </button>
        )}

        {/* Hero cover */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-caci-blue to-[#003578] relative group" style={{ minHeight: "200px" }}>
          {sermon.coverImageUrl ? (
            <img
              src={sermon.coverImageUrl}
              alt={sermon.title}
              className="w-full h-52 md:h-72 object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <div className="h-52 md:h-72 flex items-center justify-center">
              <BookOpen size={64} className="text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Floating media badge */}
          {(audioCt > 0 || videoCt > 0) && (
            <div className="absolute top-3 right-3 flex gap-1.5">
              {audioCt > 0 && (
                <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20">
                  <Volume2 size={10} /> {audioCt}
                </span>
              )}
              {videoCt > 0 && (
                <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20">
                  <Play size={10} className="fill-current" /> {videoCt}
                </span>
              )}
            </div>
          )}

          {/* Series pill */}
          {sermon.seriesTitle && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
              <Layers size={11} />
              {sermon.seriesTitle}{sermon.sequence ? ` · #${sermon.sequence}` : ""}
            </div>
          )}
        </div>

        {/* Scripture banner */}
        {sermon.scriptureReference && (
          <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-50 rounded-xl border border-amber-200/60 px-4 py-3 flex items-center gap-3">
            <span className="size-2 rounded-full bg-caci-gold animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-amber-700 font-medium uppercase tracking-wider mb-0.5">Scripture</p>
              <p className="text-[13px] text-amber-900 font-serif italic leading-snug">{sermon.scriptureReference}</p>
            </div>
          </div>
        )}

        {/* Core info */}
        <CACICard padding="lg">
          <p className="text-[12px] text-caci-blue font-medium uppercase tracking-wide">{formatDate(sermon.date)}</p>
          <h1 className="text-[22px] font-bold text-n900 leading-tight mt-1">{sermon.title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="flex items-center gap-1.5 text-[14px] text-n500">
              <Mic size={13} className="text-n400" /> {sermon.speaker}
            </span>
            {sermon.durationSeconds ? (
              <span className="flex items-center gap-1.5 text-[13px] text-n400">
                <Clock size={13} /> {formatDuration(sermon.durationSeconds)}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {sermon.scriptureReference && (
              <span className="inline-flex items-center gap-1.5 bg-caci-blue-bg text-caci-blue px-3 py-1 rounded-md text-[13px] font-medium">
                <BookOpen size={12} /> {sermon.scriptureReference}
              </span>
            )}
            {sermon.theme && (
              <span className="inline-flex items-center gap-1.5 bg-n100 text-n600 px-3 py-1 rounded-md text-[13px]">
                <Tag size={12} /> {sermon.theme}
              </span>
            )}
          </div>

          {sermon.description && (
            <div className="mt-4 text-[14px] text-n700 leading-relaxed whitespace-pre-wrap border-t border-n100 pt-4">
              {sermon.description}
            </div>
          )}
        </CACICard>

        {/* Media */}
        {hasMedia ? (
          <CACICard>
            <div className="flex items-center gap-2 mb-4">
              <FolderArchive size={15} className="text-caci-blue" />
              <h3 className="text-[15px] font-semibold text-n900">Sermon Media</h3>
              <span className="ml-auto text-[11px] text-n400 bg-n100 px-2 py-0.5 rounded-full font-mono">{media.length}</span>
            </div>
            <div className="space-y-3">
              {media.map(item => (
                <MediaCard key={item.id} item={item} sermon={sermon} />
              ))}
            </div>
          </CACICard>
        ) : (
          <CACICard>
            <div className="text-center py-5 space-y-2">
              <div className="size-10 rounded-full bg-n100 text-n400 flex items-center justify-center mx-auto">
                <Music size={18} />
              </div>
              <p className="text-[14px] font-semibold text-n700">No media attached yet</p>
              <p className="text-[12px] text-n400 max-w-sm mx-auto">Audio and video recordings for this sermon will appear here when uploaded by church leaders.</p>
            </div>
          </CACICard>
        )}

        {/* Quotations */}
        {hasQuotations && (
          <CACICard>
            <h3 className="text-[15px] font-semibold text-n900 mb-4 flex items-center gap-2">
              <Quote size={15} className="text-caci-blue/50" />
              Notable Quotes
            </h3>
            <div className="space-y-4">
              {sermon.quotations.map((q, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-n50 border border-n100">
                  <Quote size={14} className="text-caci-blue/30 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] text-n700 leading-relaxed italic">"{q.text}"</p>
                    {q.reference && <p className="text-[12px] text-n400 mt-1 font-medium">— {q.reference}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CACICard>
        )}

        {/* Prev / Next navigation */}
        {(prev || next) && (
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            {prev ? (
              <button
                onClick={() => goToSermon(prev.id)}
                className="group flex items-center gap-3 p-3.5 rounded-xl border border-n100 bg-white hover:border-caci-blue transition-all text-left active:scale-[0.98]"
              >
                <div className="size-9 shrink-0 flex items-center justify-center rounded-full bg-n100 text-n500 group-hover:bg-caci-blue group-hover:text-white transition-colors">
                  <ChevronLeft size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-n400">Previous · #{prev.sequence}</p>
                  <p className="text-[13px] font-semibold text-n900 truncate group-hover:text-caci-blue transition-colors">{prev.title}</p>
                  {prev.scriptureReference && <p className="text-[11px] text-n400 truncate">{prev.scriptureReference}</p>}
                </div>
              </button>
            ) : <div className="hidden sm:block" />}

            {next ? (
              <button
                onClick={() => goToSermon(next.id)}
                className="group flex items-center justify-end gap-3 p-3.5 rounded-xl border border-n100 bg-white hover:border-caci-blue transition-all text-right active:scale-[0.98]"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-n400">Next · #{next.sequence}</p>
                  <p className="text-[13px] font-semibold text-n900 truncate group-hover:text-caci-blue transition-colors">{next.title}</p>
                  {next.scriptureReference && <p className="text-[11px] text-n400 truncate">{next.scriptureReference}</p>}
                </div>
                <div className="size-9 shrink-0 flex items-center justify-center rounded-full bg-n100 text-n500 group-hover:bg-caci-blue group-hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </div>
              </button>
            ) : sermon.seriesId ? (
              <button
                onClick={goToSeries}
                className="group flex items-center justify-end gap-3 p-3.5 rounded-xl border-2 border-dashed border-n100 bg-n50 hover:border-caci-blue/40 hover:bg-caci-blue-bg transition-all text-right active:scale-[0.98]"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-n400">End of Series</p>
                  <p className="text-[13px] font-semibold text-n700 group-hover:text-caci-blue transition-colors truncate">Back to {sermon.seriesTitle}</p>
                </div>
                <div className="size-9 shrink-0 flex items-center justify-center rounded-full bg-n100 text-n500 group-hover:bg-caci-blue group-hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </div>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
