"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Pencil, Trash2, Music, Video, FileText, ImageIcon, Presentation,
  BookOpen, Calendar, Mic, AlertCircle, Clock, Layers, Tag,
  ExternalLink, Download, Quote, ShieldCheck, FolderArchive,
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2,
  ChevronLeft, ChevronRight, LayoutGrid,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO, SermonMediaDTO, SermonMediaType } from "@/lib/types";
import { formatDate, formatDuration, formatDateTime } from "@/lib/format";
import { normaliseCoverUrl, cn } from "@/lib/utils";
import { CACIButton, CACISkeleton, EmptyState } from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";

// ── Media type config ─────────────────────────────────────────
const MEDIA_CFG: Record<SermonMediaType, {
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
  hoverBorder: string;
  label: string;
}> = {
  audio: { icon: <Music size={16} />, bg: "bg-blue-50", text: "text-caci-blue", border: "border-blue-100", hoverBorder: "hover:border-caci-blue", label: "Audio" },
  video: { icon: <Video size={16} />, bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", hoverBorder: "hover:border-purple-400", label: "Video" },
  pdf: { icon: <FileText size={16} />, bg: "bg-rose-50", text: "text-caci-red", border: "border-rose-100", hoverBorder: "hover:border-rose-400", label: "PDF" },
  text: { icon: <Presentation size={16} />, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", hoverBorder: "hover:border-amber-400", label: "Notes" },
};

type MediaFilter = "all" | SermonMediaType;

// ── Inline Audio Player ───────────────────────────────────────
function InlineAudioPlayer({ src, title, speaker }: { src: string; title?: string; speaker?: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const handlers: [string, EventListener][] = [
      ["loadedmetadata", () => { setDuration(a.duration || 0); setLoading(false); }],
      ["timeupdate", () => setCurrent(a.currentTime)],
      ["ended", () => setPlaying(false)],
      ["play", () => setPlaying(true)],
      ["pause", () => setPlaying(false)],
      ["waiting", () => setLoading(true)],
      ["playing", () => setLoading(false)],
    ];
    handlers.forEach(([e, h]) => a.addEventListener(e, h));
    return () => handlers.forEach(([e, h]) => a.removeEventListener(e, h));
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    playing ? a.pause() : a.play().catch(() => {});
  };
  const skip = (d: number) => {
    const a = ref.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.currentTime + d, duration));
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = ref.current;
    if (!a || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * duration;
  };
  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-xl bg-slate-900 p-4 text-white shadow-inner">
      <audio ref={ref} src={src} preload="metadata" />
      {(title || speaker) && (
        <div className="mb-3 min-w-0">
          {title && <p className="text-[13px] font-semibold truncate text-white">{title}</p>}
          {speaker && <p className="text-[11px] text-slate-400 truncate">{speaker}</p>}
        </div>
      )}
      {/* Progress */}
      <div className="mb-3">
        <div onClick={seek} className="relative h-1.5 bg-slate-700 rounded-full cursor-pointer group">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-caci-blue to-caci-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progress}% - 6px)` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-mono text-slate-500">
          <span>{formatDuration(Math.floor(current))}</span>
          <span>{formatDuration(Math.floor(duration))}</span>
        </div>
      </div>
      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => skip(-15)} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors" aria-label="Back 15s"><SkipBack size={16} /></button>
        <button onClick={toggle} className="size-11 flex items-center justify-center rounded-full bg-caci-blue hover:bg-blue-600 active:scale-95 transition-all shadow-md" aria-label={playing ? "Pause" : "Play"}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : playing ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
        </button>
        <button onClick={() => skip(15)} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors" aria-label="Forward 15s"><SkipForward size={16} /></button>
        <button onClick={() => setMuted(!muted)} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors ml-2" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX size={15} className="text-slate-400" /> : <Volume2 size={15} className="text-slate-400" />}
        </button>
      </div>
    </div>
  );
}

// ── Media Vault Item ──────────────────────────────────────────
function MediaVaultItem({ item, index, isActive, onSelect }: {
  item: SermonMediaDTO;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const cfg = MEDIA_CFG[item.type as SermonMediaType] ?? MEDIA_CFG.audio;
  const label = item.label || cfg.label;

  const isMedia = item.type === "audio" || item.type === "video";
  const isDoc   = item.type === "pdf" || item.type === "text";

  return (
    <div className={cn(
      "flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200",
      isActive
        ? "border-caci-blue bg-blue-50/50 shadow-sm scale-[1.005]"
        : `border-slate-200 ${cfg.hoverBorder} hover:bg-slate-50/70`,
    )}>
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className={cn(
          "size-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border",
          isActive ? "bg-caci-blue text-white border-caci-blue" : `${cfg.bg} ${cfg.text} ${cfg.border}`,
        )}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-[12px] font-bold text-slate-900 truncate">{label}</h4>
            {isActive && <span className="text-[9px] bg-caci-blue text-white font-bold px-2 py-0.5 rounded-full shrink-0">Active</span>}
          </div>
          {item.description && <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>}
          <p className="text-[10px] text-slate-400 capitalize">{cfg.label} track</p>
        </div>
      </div>
      {isMedia ? (
        <button
          onClick={onSelect}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 shrink-0 shadow-sm",
            isActive
              ? "bg-caci-blue text-white hover:bg-blue-700"
              : "bg-slate-100 text-slate-700 hover:bg-caci-blue hover:text-white",
          )}
        >
          {isActive ? <Volume2 size={12} /> : <Play size={12} className="fill-current" />}
          <span>{isActive ? "In Player" : "Play"}</span>
        </button>
      ) : (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1.5 shrink-0"
        >
          <span>Open</span>
          <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────
function DeleteModal({ title, onCancel, onConfirm, busy }: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center" onClick={e => e.stopPropagation()}>
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-caci-red" />
        </div>
        <h3 className="text-[17px] font-bold text-slate-900">Delete Sermon?</h3>
        <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
          <span className="font-semibold text-slate-800">"{title}"</span> and all its media will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-3 mt-6">
          <CACIButton variant="secondary" className="flex-1" onClick={onCancel} disabled={busy}>Cancel</CACIButton>
          <CACIButton variant="danger" className="flex-1" onClick={onConfirm} loading={busy}>Delete Sermon</CACIButton>
        </div>
      </div>
    </div>
  );
}

// ── AdminSermonDetail ─────────────────────────────────────────
export function AdminSermonDetail() {
  const { params, back, navigate } = useApp();
  const sermonId = params.sermonId;

  const [sermon, setSermon]           = useState<SermonDTO | null>(null);
  const [loading, setLoading]         = useState(true);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [deleteBusy, setDeleteBusy]   = useState(false);
  const [activeMediaIdx, setActiveMediaIdx] = useState<number | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");

  const load = useCallback(async () => {
    if (!sermonId) { back(); return; }
    try {
      const res = await api.sermons.get(sermonId);
      setSermon(res.sermon);
      // Auto-select first audio/video track
      const firstMedia = res.sermon.media?.find(m => m.type === "audio" || m.type === "video");
      if (firstMedia) {
        const idx = res.sermon.media.sort((a, b) => a.sequence - b.sequence).indexOf(firstMedia);
        setActiveMediaIdx(idx >= 0 ? idx : null);
      }
    } catch {
      setSermon(null);
    } finally {
      setLoading(false);
    }
  }, [sermonId, back]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!sermonId) return;
    setDeleteBusy(true);
    try {
      await api.sermons.remove(sermonId);
      toast.success("Sermon deleted successfully");
      back();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete sermon");
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  }

  // ── Loading ─────────────────────────────────
  if (loading) {
    return (
      <>
        <MobileHeader title="Sermon" onBack={back} />
        <DesktopTopBar title="Sermon Detail" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-6xl mx-auto space-y-4">
          <CACISkeleton className="h-64 w-full rounded-2xl" />
          <CACISkeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <CACISkeleton className="h-64 w-full rounded-2xl" />
              <CACISkeleton className="h-24 w-full rounded-2xl" />
            </div>
            <div className="space-y-4">
              <CACISkeleton className="h-48 w-full rounded-2xl" />
              <CACISkeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!sermon) {
    return (
      <>
        <MobileHeader title="Sermon" onBack={back} />
        <DesktopTopBar title="Sermon Detail" />
        <EmptyState title="Sermon not found" description="This sermon may have been deleted." action={<CACIButton onClick={back}>Go back</CACIButton>} />
      </>
    );
  }

  const sortedMedia   = [...(sermon.media ?? [])].sort((a, b) => a.sequence - b.sequence);
  const activeMedia   = activeMediaIdx !== null ? sortedMedia[activeMediaIdx] ?? null : null;
  const coverUrl      = sermon.coverImageUrl ? normaliseCoverUrl(sermon.coverImageUrl) : null;
  const speakerInitial = sermon.speaker.charAt(0).toUpperCase();

  const audioCt   = sortedMedia.filter(m => m.type === "audio").length;
  const videoCt   = sortedMedia.filter(m => m.type === "video").length;
  const docCt     = sortedMedia.filter(m => m.type === "pdf" || m.type === "text").length;

  const filteredMedia = mediaFilter === "all"
    ? sortedMedia
    : mediaFilter === "pdf" || mediaFilter === "text"
      ? sortedMedia.filter(m => m.type === "pdf" || m.type === "text")
      : sortedMedia.filter(m => m.type === mediaFilter);

  return (
    <>
      {/* ── Mobile Header ── */}
      <MobileHeader
        title={sermon.title}
        onBack={back}
        action={
          <button onClick={() => navigate("admin-sermon-edit")} className="p-2 rounded-lg hover:bg-white/20 active:bg-white/30 transition-colors">
            <Pencil size={18} className="text-white" />
          </button>
        }
      />

      {/* ── Desktop Top Bar ── */}
      <DesktopTopBar
        title={sermon.title}
        subtitle={formatDate(sermon.date)}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" leftIcon={<Pencil size={14} />} onClick={() => navigate("admin-sermon-edit")}>
              Edit Sermon
            </CACIButton>
            <CACIButton variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>
              Delete
            </CACIButton>
          </div>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-6xl mx-auto space-y-6 pb-10">

        {/* ── HERO CARD ── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 group">
          {/* Cover banner */}
          <div className="relative h-56 sm:h-72 bg-slate-900 overflow-hidden">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={sermon.title}
                className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-700 ease-out opacity-80"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a6b] to-caci-blue flex items-center justify-center opacity-30">
                <Layers size={96} className="text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-slate-100 text-[11px] font-medium border border-white/20 shadow">
              <FolderArchive size={12} className="text-caci-gold" />
              <span>Message <span className="text-caci-gold font-bold"># {sermon.sequence}</span></span>
            </div>
              {sermon.theme && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-medium border border-white/25">
                  <Tag size={11} className="text-blue-200" />
                  <span className="italic">{sermon.theme}</span>
                </div>
              )}
            </div>

            {/* Bottom hero text */}
            <div className="absolute bottom-5 left-4 right-4 sm:left-6 sm:right-6 z-10 text-white space-y-2">
              {sermon.scriptureReference && (
                <div className="flex items-center gap-2 text-caci-gold text-[11px] font-bold uppercase tracking-widest">
                  <BookOpen size={13} />
                  <span>{sermon.scriptureReference}</span>
                </div>
              )}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight drop-shadow-md">
                {sermon.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <div className="size-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">{speakerInitial}</div>
                  <span className="text-[11px] font-medium">{sermon.speaker}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <Calendar size={11} className="text-blue-300" />
                  <span className="text-[11px]">{formatDate(sermon.date)}</span>
                </div>
                {sermon.durationSeconds && (
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <Clock size={11} className="text-blue-300" />
                    <span className="text-[11px]">{formatDuration(sermon.durationSeconds)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scripture banner */}
          {sermon.scriptureReference && (
            <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-50 border-y border-amber-200/60 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="size-2 rounded-full bg-caci-gold animate-pulse shrink-0" />
                <p className="text-[12px] sm:text-[13px] text-amber-900 font-serif italic leading-snug truncate">
                  Scripture: <span className="font-semibold not-italic">{sermon.scriptureReference}</span>
                </p>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300/60 shrink-0 uppercase tracking-widest">
                CACI Assakae
              </span>
            </div>
          )}
        </div>

        {/* ── ACTIVE MEDIA PLAYER ── */}
        {activeMedia && (activeMedia.type === "audio" || activeMedia.type === "video") && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn("size-10 rounded-xl flex items-center justify-center border shrink-0",
                activeMedia.type === "video" ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-caci-blue border-blue-100"
              )}>
                {activeMedia.type === "video" ? <Video size={18} /> : <Volume2 size={18} />}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-900 truncate">{activeMedia.label || (activeMedia.type === "video" ? "Video Recording" : "Audio Recording")}</p>
                <p className="text-[11px] text-slate-500">
                  {activeMedia.type === "video" ? "Video" : "Audio"} · Track {activeMediaIdx! + 1} of {sortedMedia.filter(m => m.type === "audio" || m.type === "video").length}
                </p>
              </div>
              <button onClick={() => window.open(activeMedia.url, "_blank")} className="ml-auto p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Open in new tab">
                <ExternalLink size={15} />
              </button>
            </div>
            {activeMedia.type === "audio" ? (
              <InlineAudioPlayer key={activeMedia.id} src={activeMedia.url} title={activeMedia.label ?? undefined} speaker={sermon.speaker} />
            ) : (
              <div className="rounded-xl overflow-hidden bg-black aspect-video shadow-inner border border-slate-800">
                <video key={activeMedia.id} src={activeMedia.url} controls className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        )}

        {/* ── 3-COLUMN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT 2 COL */}
          <div className="lg:col-span-2 space-y-6">

            {/* Media Vault */}
            {sortedMedia.length > 0 ? (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                      <FolderArchive size={15} className="text-caci-blue" />
                      Sermon Media Vault
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sortedMedia.length} attached {sortedMedia.length === 1 ? "item" : "items"}
                      {audioCt > 0 && ` · ${audioCt} Audio`}
                      {videoCt > 0 && ` · ${videoCt} Video`}
                      {docCt > 0 && ` · ${docCt} Doc`}
                    </p>
                  </div>
                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold text-slate-600 shrink-0">
                    {([
                      { key: "all",   label: `All (${sortedMedia.length})` },
                      { key: "audio", label: `Audio (${audioCt})` },
                      { key: "video", label: `Video (${videoCt})` },
                      { key: "pdf",   label: `Docs (${docCt})` },
                    ] as { key: MediaFilter; label: string }[]).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setMediaFilter(key)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg transition-all",
                          mediaFilter === key ? "bg-white text-caci-blue shadow-sm" : "hover:text-slate-900",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredMedia.length === 0 ? (
                    <p className="text-[12px] text-slate-400 py-4 text-center">No {mediaFilter} items attached.</p>
                  ) : (
                    filteredMedia.map((item) => {
                      const origIdx = sortedMedia.indexOf(item);
                      return (
                        <MediaVaultItem
                          key={item.id}
                          item={item}
                          index={origIdx}
                          isActive={activeMediaIdx === origIdx}
                          onSelect={() => setActiveMediaIdx(origIdx)}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 text-center space-y-3">
                <div className="size-12 rounded-2xl bg-blue-50 text-caci-blue flex items-center justify-center mx-auto">
                  <Music size={22} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">No Media Files Attached</h3>
                  <p className="text-[13px] text-slate-500 max-w-md mx-auto leading-relaxed mt-1">
                    This sermon record does not have audio recordings, video streams, presentation slides, or PDF notes attached yet.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <CACIButton
                    size="sm"
                    leftIcon={<Pencil size={14} />}
                    onClick={() => navigate("admin-sermon-edit")}
                  >
                    Attach Audio, Video or Notes
                  </CACIButton>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
              <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                <LayoutGrid size={14} className="text-caci-blue" />
                Message Summary & Notes
              </h3>
              {sermon.description ? (
                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{sermon.description}</p>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-[13px] text-slate-400 italic">No summary or message notes recorded for this sermon yet.</p>
                  <button
                    onClick={() => navigate("admin-sermon-edit")}
                    className="text-[12px] font-semibold text-caci-blue hover:underline inline-flex items-center gap-1"
                  >
                    <Pencil size={12} /> Add sermon summary
                  </button>
                </div>
              )}
            </div>

            {/* Quotations */}
            {sermon.quotations?.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50/40 via-white to-amber-50/30 rounded-2xl p-5 sm:p-6 shadow-sm border border-blue-100 space-y-4">
                <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                  <Quote size={15} className="text-caci-gold" />
                  Notable Quotations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sermon.quotations.map((q, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                      <p className="font-serif italic text-[12px] text-slate-700 leading-relaxed">"{q.text}"</p>
                      {q.reference && <p className="text-[10px] font-bold text-caci-blue text-right">— {q.reference}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile-only action buttons */}
            <div className="lg:hidden flex flex-col gap-3 pt-2">
              <CACIButton leftIcon={<Pencil size={16} />} onClick={() => navigate("admin-sermon-edit")}>Edit Sermon</CACIButton>
              <CACIButton variant="danger" leftIcon={<Trash2 size={16} />} onClick={() => setDeleteOpen(true)}>Delete Sermon</CACIButton>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5">

            {/* Metadata card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Record Metadata</h3>
              <div className="space-y-3 divide-y divide-slate-100 text-[12px]">
                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Mic size={13} className="text-caci-blue" /> Preacher</span>
                  <span className="font-bold text-slate-900 text-right truncate">{sermon.speaker}</span>
                </div>
                <div className="pt-3 flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Calendar size={13} className="text-caci-blue" /> Date</span>
                  <span className="font-semibold text-slate-900">{formatDate(sermon.date)}</span>
                </div>
                {sermon.durationSeconds && (
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Clock size={13} className="text-caci-blue" /> Duration</span>
                    <span className="font-semibold text-slate-900">{formatDuration(sermon.durationSeconds)}</span>
                  </div>
                )}
                {sermon.scriptureReference && (
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><BookOpen size={13} className="text-caci-gold" /> Scripture</span>
                    <span className="font-bold text-caci-blue">{sermon.scriptureReference}</span>
                  </div>
                )}
                <div className="pt-3 flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Layers size={13} className="text-caci-blue" /> Sequence</span>
                  <span className="font-bold text-caci-blue text-right truncate">#{sermon.sequence}</span>
                </div>
                {sermon.theme && (
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Tag size={13} className="text-caci-blue" /> Theme</span>
                    <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 truncate text-[10px]">{sermon.theme}</span>
                  </div>
                )}
                <div className="pt-3 flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><FolderArchive size={13} className="text-caci-blue" /> Media</span>
                  <span className="font-semibold text-slate-900">{sortedMedia.length} items</span>
                </div>
              </div>
            </div>

            {/* System Audit */}
            <div className="bg-slate-900 rounded-2xl p-5 text-slate-300 text-[11px] space-y-3 shadow-md border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-white border-b border-slate-800 pb-2.5">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>System Audit</span>
              </div>
              <div className="space-y-2 text-slate-400">
                <div className="flex justify-between gap-2">
                  <span>Created</span>
                  <span className="text-slate-200 text-right">{formatDateTime(sermon.createdAt)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Last Modified</span>
                  <span className="text-slate-200 text-right">{formatDateTime(sermon.updatedAt)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Sermon ID</span>
                  <span className="text-slate-400 font-mono text-[9px] truncate max-w-[120px]">{sermon.id}</span>
                </div>
                <div className="flex justify-between items-center gap-2 pt-1">
                  <span>Status</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live on App
                  </span>
                </div>
              </div>
            </div>

            {/* Actions card */}
            <div className="hidden lg:block bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin Actions</h4>
              <CACIButton className="w-full" leftIcon={<Pencil size={15} />} onClick={() => navigate("admin-sermon-edit")}>
                Edit Sermon Record
              </CACIButton>
              <CACIButton variant="danger" className="w-full" leftIcon={<Trash2 size={15} />} onClick={() => setDeleteOpen(true)}>
                Delete Sermon
              </CACIButton>
            </div>

          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteOpen && (
        <DeleteModal
          title={sermon.title}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          busy={deleteBusy}
        />
      )}
    </>
  );
}
