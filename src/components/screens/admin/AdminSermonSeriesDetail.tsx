"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, BookOpen, Calendar, Mic, Layers, AlertCircle, Clock,
  MoreVertical, GripVertical,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonSeriesDTO, SermonDTO } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/format";
import {
  CACIButton, CACICard, CACISkeleton, EmptyState, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";
import { normaliseCoverUrl } from "@/lib/utils";

// ── Media type dots ───────────────────────────────────────────
const MEDIA_DOT: Record<string, string> = {
  audio:    "bg-caci-blue",
  video:    "bg-blue-400",
  document: "bg-blue-300",
  image:    "bg-blue-200",
  slides:   "bg-blue-500",
};

export function AdminSermonSeriesDetail() {
  const { params, back, navigate, setParam, setAdminMobileMenuOpen } = useApp();
  const seriesId = params.seriesId;

  const [series, setSeries]               = useState<SermonSeriesDTO | null>(null);
  const [sermons, setSermons]             = useState<SermonDTO[] | null>(null);
  const [loading, setLoading]             = useState(true);
  const [deleteSeriesOpen, setDeleteSeriesOpen] = useState(false);
  const [deleteSermonId, setDeleteSermonId]     = useState<string | null>(null);
  const [actionBusy, setActionBusy]       = useState(false);

  const load = useCallback(async () => {
    if (!seriesId) { back(); return; }
    try {
      const [serRes, smRes] = await Promise.all([
        api.sermonSeries.get(seriesId),
        api.sermons.list(seriesId),
      ]);
      setSeries(serRes.series);
      setSermons(smRes.sermons);
    } catch {
      setSeries(null);
      setSermons([]);
    } finally {
      setLoading(false);
    }
  }, [seriesId, back]);

  useEffect(() => { load(); }, [load]);

  async function handleDeleteSeries() {
    if (!seriesId) return;
    setActionBusy(true);
    try {
      await api.sermonSeries.remove(seriesId);
      toast.success("Series deleted");
      back();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete series");
    } finally {
      setActionBusy(false);
      setDeleteSeriesOpen(false);
    }
  }

  async function handleDeleteSermon(id: string) {
    setActionBusy(true);
    try {
      await api.sermons.remove(id);
      toast.success("Sermon removed");
      setDeleteSermonId(null);
      setSermons((prev) => (prev || []).filter((s) => s.id !== id));
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete sermon");
    } finally {
      setActionBusy(false);
    }
  }

  async function commitReorder(reordered: SermonDTO[]) {
    try {
      await Promise.all(
        reordered.map((s, idx) =>
          s.sequence !== idx + 1
            ? api.sermons.update(s.id, { sequence: idx + 1 })
            : Promise.resolve()
        )
      );
    } catch {
      toast.error("Reorder failed — please refresh");
      await load();
    }
  }

  function openSermonDetail(sermon: SermonDTO) {
    setParam("sermonId", sermon.id);
    navigate("admin-sermon-detail");
  }

  function addSermon()  { navigate("admin-sermon-add"); }
  function editSeries() { navigate("admin-sermon-series-edit"); }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <MobileHeader title="Series" onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title="Sermon Series" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-5xl space-y-6">
          <CACISkeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <CACISkeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!series) {
    return (
      <>
        <MobileHeader title="Series" onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title="Sermon Series" />
        <EmptyState title="Series not found" action={<CACIButton onClick={back}>Go back</CACIButton>} />
      </>
    );
  }

  const isOngoing     = series.status === "ongoing";
  const sermonCount   = sermons?.length ?? 0;
  const seriesCoverUrl = series.coverImage ? normaliseCoverUrl(series.coverImage) : null;

  return (
    <>
      <MobileHeader title={series.title} onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
      <DesktopTopBar
        title={series.title}
        subtitle={`${series.year} · ${sermonCount} sermon${sermonCount !== 1 ? "s" : ""}`}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" onClick={editSeries}>
              Edit Series
            </CACIButton>
            <CACIButton size="sm" leftIcon={<Plus size={15} />} onClick={addSermon}>
              Add Sermon
            </CACIButton>
          </div>
        }
      />

      <div className="py-4 md:py-8 max-w-md mx-auto md:max-w-5xl space-y-8">

        {/* ── Series hero card ──────────────────────────────── */}
        <div className="px-4 md:px-8">
          <CACICard padding="none" className="overflow-hidden rounded-2xl border border-n100 shadow-sm">
            <div className="flex flex-col md:flex-row">
              {/* Cover image — taller on desktop */}
              <div className="h-48 md:h-auto md:w-56 shrink-0 bg-gradient-to-br from-caci-blue to-[#003578] relative flex items-center justify-center">
                {seriesCoverUrl ? (
                  <img
                    src={seriesCoverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  <Layers size={48} className="text-white/30" />
                )}
                {/* Status badge */}
                <span
                  className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${
                    isOngoing
                      ? "bg-caci-blue text-white border border-blue-300"
                      : "bg-white/90 text-n700 border border-n200"
                  }`}
                >
                  {isOngoing ? "● LIVE" : `✓ ${series.year}`}
                </span>
              </div>

              {/* Info */}
              <div className="p-5 md:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-[22px] md:text-[26px] font-bold text-n900 leading-tight">
                        {series.title}
                      </h1>
                      {series.theme && (
                        <p className="text-[14px] text-caci-blue font-semibold mt-1.5">
                          {series.theme}
                        </p>
                      )}
                    </div>
                    <button
                      className="md:hidden p-1.5 rounded-lg hover:bg-n100 transition-colors shrink-0"
                      onClick={editSeries}
                    >
                      <MoreVertical size={18} className="text-n500" />
                    </button>
                  </div>

                  {series.anchorText && (
                    <p className="text-[13px] text-n500 mt-3 italic flex items-center gap-1.5">
                      📖 <span>{series.anchorText}</span>
                    </p>
                  )}
                  {series.description && (
                    <p className="text-[14px] text-n600 mt-3 leading-relaxed">
                      {series.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-5 pt-4 border-t border-n100 text-[12px] text-n400">
                  {series.startDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} /> Started {formatDate(series.startDate)}
                    </span>
                  )}
                  {series.endDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} /> Ended {formatDate(series.endDate)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={12} /> {sermonCount} sermon{sermonCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </CACICard>
        </div>

        {/* ── Sermons grid ──────────────────────────────────── */}
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-5 px-4 md:px-8">
            <SectionHeading title={`Sermons (${sermonCount})`} />
            <div className="flex items-center gap-3">
              <button
                onClick={addSermon}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-caci-blue bg-caci-blue-bg hover:bg-[#ddeeff] active:bg-[#c8e0ff] border border-blue-200 px-3.5 py-1.5 rounded-full transition-all duration-150"
              >
                <Plus size={14} />
                Add sermon
              </button>
              <button
                onClick={() => setDeleteSeriesOpen(true)}
                className="text-[12px] text-n400 hover:text-caci-red flex items-center gap-1 transition-colors"
              >
                Delete series
              </button>
            </div>
          </div>

          {(!sermons || sermons.length === 0) ? (
            <div className="px-4 md:px-8">
              <EmptyState
                icon={<BookOpen size={26} />}
                title="No sermons in this series yet"
                description="Add your first sermon to get started."
                action={
                  <button
                    onClick={addSermon}
                    className="flex items-center gap-2 text-[14px] font-semibold text-caci-blue bg-caci-blue-bg hover:bg-[#ddeeff] border border-blue-200 px-4 py-2.5 rounded-full transition-all"
                  >
                    <Plus size={15} />
                    Add first sermon
                  </button>
                }
              />
            </div>
          ) : (
            <SermonGrid
              sermons={sermons}
              seriesCoverUrl={seriesCoverUrl}
              onView={openSermonDetail}
              onAddSermon={addSermon}
              onReorderComplete={(reordered) => {
                setSermons(reordered);
                commitReorder(reordered);
              }}
            />
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      {deleteSeriesOpen && (
        <ConfirmModal
          title={`Delete "${series.title}"?`}
          description="This will permanently remove this series and all its sermons. This cannot be undone."
          confirmLabel="Delete Series"
          onCancel={() => setDeleteSeriesOpen(false)}
          onConfirm={handleDeleteSeries}
          busy={actionBusy}
          danger
        />
      )}

      {deleteSermonId && (
        <ConfirmModal
          title="Remove sermon?"
          description="This sermon will be permanently deleted."
          confirmLabel="Delete Sermon"
          onCancel={() => setDeleteSermonId(null)}
          onConfirm={() => handleDeleteSermon(deleteSermonId)}
          busy={actionBusy}
          danger
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SermonGrid — 3-column desktop grid, 2-column mobile
// Drag-to-reorder retained via HTML5 drag API on desktop,
// long-press pointer capture on mobile.
// ═══════════════════════════════════════════════════════════════

function SermonGrid({
  sermons,
  seriesCoverUrl,
  onView,
  onAddSermon,
  onReorderComplete,
}: {
  sermons: SermonDTO[];
  seriesCoverUrl: string | null;
  onView: (s: SermonDTO) => void;
  onAddSermon: () => void;
  onReorderComplete: (reordered: SermonDTO[]) => void;
}) {
  const [items, setItems] = useState<SermonDTO[]>(sermons);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => { setItems(sermons); }, [sermons]);

  // ── HTML5 drag handlers (desktop) ─────────────────────────
  function onDragStart(idx: number) {
    setDragFrom(idx);
  }

  function onDragEnter(idx: number) {
    if (dragFrom === null || idx === dragFrom) return;
    setDragOver(idx);
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragFrom, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragFrom(idx); // pivot follows the dragged card
  }

  function onDragEnd() {
    const finalItems = items.map((s, i) => ({ ...s, sequence: i + 1 }));
    setDragFrom(null);
    setDragOver(null);
    setItems(finalItems);
    onReorderComplete(finalItems);
  }

  // ── Mobile long-press drag (scroll container) ──────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeDragIdx = useRef<number | null>(null);
  const dragStartY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOverIdxRef = useRef<number | null>(null);
  const CARD_H = 300; // approx card height in mobile grid
  const COLS   = 2;

  const commitMobileDrop = useCallback(() => {
    const fromIdx = activeDragIdx.current;
    const toIdx   = dragOverIdxRef.current;
    activeDragIdx.current  = null;
    dragOverIdxRef.current = null;
    setDragFrom(null);
    setDragOver(null);
    if (fromIdx !== null && toIdx !== null && toIdx !== fromIdx) {
      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        const withSeq = next.map((s, i) => ({ ...s, sequence: i + 1 }));
        onReorderComplete(withSeq);
        return withSeq;
      });
    }
  }, [onReorderComplete]);

  const onWindowMove = useCallback((e: PointerEvent) => {
    if (activeDragIdx.current === null) return;
    const deltaY = e.clientY - dragStartY.current;
    const rowDelta = Math.round(deltaY / CARD_H) * COLS;
    const cardCount = items.length;
    const newIdx = Math.max(0, Math.min(cardCount - 1, (activeDragIdx.current ?? 0) + rowDelta));
    dragOverIdxRef.current = newIdx;
    setDragOver(newIdx);
  }, [items.length]);

  const onWindowUp = useCallback(() => {
    window.removeEventListener("pointermove",   onWindowMove);
    window.removeEventListener("pointerup",     onWindowUpRef.current);
    window.removeEventListener("pointercancel", onWindowUpRef.current);
    commitMobileDrop();
  }, [onWindowMove, commitMobileDrop]);

  const onWindowUpRef = useRef(onWindowUp);
  onWindowUpRef.current = onWindowUp;

  function onGripPointerDown(e: React.PointerEvent, idx: number) {
    // Only activate on touch — desktop uses HTML5 drag
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    dragStartY.current = e.clientY;
    longPressTimer.current = setTimeout(() => {
      activeDragIdx.current  = idx;
      dragOverIdxRef.current = idx;
      setDragFrom(idx);
      setDragOver(idx);
      if (navigator.vibrate) navigator.vibrate(30);
      window.addEventListener("pointermove",   onWindowMove);
      window.addEventListener("pointerup",     onWindowUp);
      window.addEventListener("pointercancel", onWindowUp);
    }, 400);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  return (
    <div ref={scrollRef} className="px-4 md:px-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {items.map((sermon, idx) => (
          <SermonCard
            key={sermon.id}
            sermon={sermon}
            seriesCoverUrl={seriesCoverUrl}
            isDragging={dragFrom === idx}
            isDropTarget={dragOver === idx && dragFrom !== idx}
            onView={() => { if (activeDragIdx.current === null) onView(sermon); }}
            onDragStart={() => onDragStart(idx)}
            onDragEnter={() => onDragEnter(idx)}
            onDragEnd={onDragEnd}
            onGripPointerDown={(e) => onGripPointerDown(e, idx)}
            onGripPointerUp={cancelLongPress}
          />
        ))}

        {/* Trailing add card */}
        <button
          onClick={onAddSermon}
          className="rounded-2xl border-2 border-dashed border-blue-200 bg-caci-blue-bg/40 hover:bg-caci-blue-bg hover:border-blue-300 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[260px] group"
        >
          <div className="size-12 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center">
            <Plus size={22} className="text-caci-blue" />
          </div>
          <span className="text-[13px] font-semibold text-caci-blue">Add sermon</span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SermonCard — matches the Awakenur reference grid card layout:
//  · Full-width cover image with category/sequence badge overlay
//  · Speaker initial avatar bottom-right of image
//  · Media dots bottom-left
//  · White card body: title + meta row + Open button
// ═══════════════════════════════════════════════════════════════

function SermonCard({
  sermon,
  seriesCoverUrl,
  isDragging,
  isDropTarget,
  onView,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onGripPointerDown,
  onGripPointerUp,
}: {
  sermon: SermonDTO;
  seriesCoverUrl: string | null;
  isDragging: boolean;
  isDropTarget: boolean;
  onView: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onGripPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onGripPointerUp: () => void;
}) {
  const speakerInitial = sermon.speaker.charAt(0).toUpperCase();
  const hasMedia       = sermon.media && sermon.media.length > 0;
  const rawCover       = sermon.coverImageUrl ?? null;
  const coverUrl       = rawCover ? normaliseCoverUrl(rawCover) : seriesCoverUrl;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnter={(e) => { e.preventDefault(); onDragEnter(); }}
      onDragOver={(e)  => e.preventDefault()}
      onDragEnd={onDragEnd}
      className={`group rounded-2xl overflow-hidden border bg-white shadow-sm transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:-translate-y-0.5
        ${isDragging   ? "opacity-50 scale-95 ring-2 ring-caci-blue ring-offset-2" : ""}
        ${isDropTarget ? "ring-2 ring-caci-blue ring-offset-2" : "border-n100"}
      `}
      onClick={onView}
    >
      {/* ── Cover image ─────────────────────────────── */}
      <div className="relative h-44 md:h-48 bg-gradient-to-br from-[#1a3a6b] to-caci-blue overflow-hidden">
        {coverUrl && (
          <img
            src={coverUrl}
            alt={sermon.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            draggable={false}
          />
        )}

        {/* Gradient scrim — darker at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

        {/* ── Drag grip (top-left) — long-press on mobile, visual on desktop */}
        <div
          className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/25 backdrop-blur-sm cursor-grab active:cursor-grabbing touch-none select-none opacity-60 hover:opacity-100 transition-opacity"
          onPointerDown={(e) => { e.stopPropagation(); onGripPointerDown(e); }}
          onPointerUp={(e)   => { e.stopPropagation(); onGripPointerUp(); }}
          onPointerCancel={onGripPointerUp}
        >
          <GripVertical size={14} className="text-white" />
        </div>

        {/* Sequence badge (top-right) */}
        <div className="absolute top-2.5 right-2.5">
          <span className="text-[10px] font-bold text-white bg-black/35 backdrop-blur-sm px-2 py-0.5 rounded-full">
            #{sermon.sequence}
          </span>
        </div>

        {/* Speaker initial avatar (bottom-right) */}
        <div className="absolute bottom-3 right-3 size-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
          <span className="text-white text-[12px] font-bold">{speakerInitial}</span>
        </div>

        {/* Media dots (bottom-left) */}
        {hasMedia && (
          <div className="absolute bottom-3.5 left-3 flex gap-1.5">
            {sermon.media.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className={`size-2 rounded-full ${MEDIA_DOT[m.type] ?? "bg-blue-300"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Card body ───────────────────────────────── */}
      <div className="p-4">
        {/* Title */}
        <h4 className="text-[14px] font-bold text-n900 line-clamp-2 leading-snug group-hover:text-caci-blue transition-colors">
          {sermon.title}
        </h4>

        {/* Meta row */}
        <div className="mt-2.5 space-y-1">
          <p className="text-[12px] text-n500 flex items-center gap-1.5 truncate">
            <Mic size={11} className="shrink-0 text-n400" />
            {sermon.speaker}
          </p>
          <p className="text-[12px] text-n400 flex items-center gap-1.5">
            <Calendar size={11} className="shrink-0" />
            {formatDate(sermon.date)}
          </p>
          {sermon.durationSeconds && (
            <p className="text-[12px] text-n400 flex items-center gap-1.5">
              <Clock size={11} className="shrink-0" />
              {formatDuration(sermon.durationSeconds)}
            </p>
          )}
        </div>

        {/* Open CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="mt-4 w-full bg-n900 hover:bg-[#1a1a2e] active:scale-[0.98] text-white text-[12px] font-bold py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          Open <span className="text-[14px] leading-none">→</span>
        </button>
      </div>
    </div>
  );
}

// ── ConfirmModal ──────────────────────────────────────────────
function ConfirmModal({
  title, description, confirmLabel, onCancel, onConfirm, busy, danger,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl max-w-md w-full p-5 md:p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${danger ? "bg-red-50" : "bg-caci-blue-bg"}`}>
          <AlertCircle size={20} className={danger ? "text-caci-red" : "text-caci-blue"} />
        </div>
        <h3 className="text-[16px] font-bold text-n900">{title}</h3>
        <p className="text-[14px] text-n500 mt-1.5 leading-relaxed">{description}</p>
        <div className="flex gap-3 mt-5">
          <CACIButton variant="secondary" className="flex-1" onClick={onCancel} disabled={busy}>
            Cancel
          </CACIButton>
          <CACIButton
            variant={danger ? "danger" : "primary"}
            className="flex-1"
            onClick={onConfirm}
            loading={busy}
          >
            {confirmLabel}
          </CACIButton>
        </div>
      </div>
    </div>
  );
}
