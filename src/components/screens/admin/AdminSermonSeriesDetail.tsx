"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, BookOpen, Calendar, Mic, Layers, AlertCircle, Clock, MoreVertical,
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
  const { params, back, navigate, setParam } = useApp();
  const seriesId = params.seriesId;

  const [series, setSeries] = useState<SermonSeriesDTO | null>(null);
  const [sermons, setSermons] = useState<SermonDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSeriesOpen, setDeleteSeriesOpen] = useState(false);
  const [deleteSermonId, setDeleteSermonId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

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
      navigate("admin-sermons");
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

  // Commit new ordering to the API after drag completes
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

  function addSermon() {
    navigate("admin-sermon-add");
  }

  function editSeries() {
    navigate("admin-sermon-series-edit");
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <MobileHeader title="Series" onBack={back} />
        <DesktopTopBar title="Sermon Series" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-5xl space-y-4">
          <CACISkeleton className="h-32 w-full rounded-xl" />
          <CACISkeleton className="h-6 w-1/2" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <CACISkeleton key={i} className="h-60 w-44 shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!series) {
    return (
      <>
        <MobileHeader title="Series" onBack={back} />
        <DesktopTopBar title="Sermon Series" />
        <EmptyState title="Series not found" action={<CACIButton onClick={back}>Go back</CACIButton>} />
      </>
    );
  }

  const isOngoing = series.status === "ongoing";
  const sermonCount = sermons?.length ?? 0;
  // Series cover — used as fallback on sermon cards that have no own cover
  const seriesCoverUrl = series.coverImage ? normaliseCoverUrl(series.coverImage) : null;

  return (
    <>
      <MobileHeader title={series.title} onBack={back} />
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

      <div className="py-4 md:py-6 max-w-md mx-auto md:max-w-5xl space-y-6">

        {/* Series header card */}
        <div className="px-4 md:px-8">
          <CACICard padding="none" className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Cover */}
              <div className="h-40 md:h-auto md:w-48 shrink-0 bg-gradient-to-br from-caci-blue to-[#003578] relative flex items-center justify-center">
                {seriesCoverUrl ? (
                  <img
                    src={seriesCoverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  <Layers size={40} className="text-white/50" />
                )}
                <span
                  className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded-full ${
                    isOngoing ? "bg-caci-blue text-white" : "bg-white/90 text-n700"
                  }`}
                >
                  {isOngoing ? "● LIVE" : `✓ ${series.year}`}
                </span>
              </div>

              {/* Meta */}
              <div className="p-4 md:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-[20px] font-bold text-n900 leading-tight">{series.title}</h1>
                      {series.theme && (
                        <p className="text-[14px] text-caci-blue font-medium mt-1">{series.theme}</p>
                      )}
                    </div>
                    <button
                      className="md:hidden p-1.5 rounded-lg hover:bg-n100 transition-colors"
                      onClick={editSeries}
                    >
                      <MoreVertical size={18} className="text-n500" />
                    </button>
                  </div>
                  {series.anchorText && (
                    <p className="text-[13px] text-n500 mt-2 italic">📖 {series.anchorText}</p>
                  )}
                  {series.description && (
                    <p className="text-[14px] text-n600 mt-3 leading-relaxed">{series.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[12px] text-n400">
                  {series.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Started {formatDate(series.startDate)}
                    </span>
                  )}
                  {series.endDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Ended {formatDate(series.endDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CACICard>
        </div>

        {/* ── Sermons section ─────────────────────────────── */}
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-3 px-4 md:px-8">
            <SectionHeading title={`Sermons (${sermonCount})`} />
            <div className="flex items-center gap-3">
              {/* Blue pill Add button */}
              <button
                onClick={addSermon}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-caci-blue bg-caci-blue-bg hover:bg-[#ddeeff] active:bg-[#c8e0ff] border border-blue-200 px-3 py-1.5 rounded-full transition-all duration-150"
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

          {/* Sermon cards — drag-to-reorder horizontal scroll */}
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
            <DraggableSermonRow
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

      {/* Delete series confirmation */}
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

      {/* Delete sermon confirmation */}
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

// ── DraggableSermonRow ────────────────────────────────────────
// Horizontal scroll with long-press drag-to-reorder.
// Hold the ⠿ grip for 400ms → card lifts → drag left/right to reorder.

const CARD_WIDTH = 176; // px (w-44 = 11rem = 176px)
const CARD_GAP   = 12;  // px (gap-3)

function DraggableSermonRow({
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
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep local items in sync if parent sermons prop changes
  useEffect(() => { setItems(sermons); }, [sermons]);

  const dragStartX = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDragIdx = useRef<number | null>(null);

  function startLongPress(idx: number, clientX: number) {
    longPressTimer.current = setTimeout(() => {
      activeDragIdx.current = idx;
      setDraggingIdx(idx);
      if (navigator.vibrate) navigator.vibrate(30);
      dragStartX.current = clientX;
    }, 400);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (activeDragIdx.current === null) return;
    const deltaX = e.clientX - dragStartX.current;
    const movedSlots = Math.round(deltaX / (CARD_WIDTH + CARD_GAP));
    const newIdx = Math.max(0, Math.min(items.length - 1, activeDragIdx.current + movedSlots));
    setDragOverIdx(newIdx);
  }

  function onPointerUp() {
    cancelLongPress();
    if (
      activeDragIdx.current !== null &&
      dragOverIdx !== null &&
      dragOverIdx !== activeDragIdx.current
    ) {
      const reordered = [...items];
      const [moved] = reordered.splice(activeDragIdx.current, 1);
      reordered.splice(dragOverIdx, 0, moved);
      const withSeq = reordered.map((s, i) => ({ ...s, sequence: i + 1 }));
      setItems(withSeq);
      onReorderComplete(withSeq);
    }
    activeDragIdx.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-4 px-4 md:px-8 snap-x snap-mandatory select-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {items.map((sermon, idx) => (
        <SermonCard
          key={sermon.id}
          sermon={sermon}
          seriesCoverUrl={seriesCoverUrl}
          isDragging={draggingIdx === idx}
          isDropTarget={dragOverIdx === idx && draggingIdx !== idx}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            startLongPress(idx, e.clientX);
          }}
          onPointerUp={onPointerUp}
          onView={() => {
            if (draggingIdx === null) onView(sermon);
          }}
        />
      ))}

      {/* Trailing add card */}
      <button
        onClick={onAddSermon}
        className="w-44 shrink-0 snap-start rounded-2xl border-2 border-dashed border-blue-200 bg-caci-blue-bg/50 hover:bg-caci-blue-bg hover:border-blue-300 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[200px] group"
      >
        <div className="size-10 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center">
          <Plus size={20} className="text-caci-blue" />
        </div>
        <span className="text-[12px] font-semibold text-caci-blue">Add sermon</span>
      </button>
    </div>
  );
}

// ── SermonCard ────────────────────────────────────────────────
function SermonCard({
  sermon,
  seriesCoverUrl,
  isDragging,
  isDropTarget,
  onPointerDown,
  onPointerUp,
  onView,
}: {
  sermon: SermonDTO;
  seriesCoverUrl: string | null;
  isDragging: boolean;
  isDropTarget: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onView: () => void;
}) {
  const speakerInitial = sermon.speaker.charAt(0).toUpperCase();
  const hasMedia = sermon.media && sermon.media.length > 0;

  // Use sermon's own cover; fall back to series cover
  const rawCover = sermon.coverImageUrl ?? null;
  const coverUrl = rawCover ? normaliseCoverUrl(rawCover) : seriesCoverUrl;

  return (
    <div
      className={`w-44 shrink-0 snap-start transition-all duration-200 ${
        isDragging ? "scale-105 rotate-1 opacity-80 z-10 shadow-2xl" : ""
      } ${isDropTarget ? "ring-2 ring-caci-blue rounded-2xl" : ""}`}
    >
      {/* Main tappable card */}
      <div
        className="w-full rounded-2xl overflow-hidden border border-n100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 group cursor-pointer"
        onClick={onView}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {/* Card header — cover image or blue gradient */}
        <div className="h-28 bg-gradient-to-br from-[#1a3a6b] to-caci-blue relative overflow-hidden">
          {coverUrl && (
            <img
              src={coverUrl}
              alt={sermon.title}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          )}
          {/* Scrim for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

          {/* ⠿ Drag grip — top-left, signals draggability on long-press */}
          <div className="absolute top-2 left-2 flex flex-col gap-[3px] px-1 py-1 rounded-md bg-black/20 backdrop-blur-sm">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-[3px]">
                {[0, 1].map((col) => (
                  <div key={col} className="size-[3px] rounded-full bg-white/80" />
                ))}
              </div>
            ))}
          </div>

          {/* Sequence badge */}
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold text-white/80 bg-black/25 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
              #{sermon.sequence}
            </span>
          </div>

          {/* Speaker initial avatar */}
          <div className="absolute bottom-2 right-2 size-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">{speakerInitial}</span>
          </div>

          {/* Media type dots */}
          {hasMedia && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {sermon.media.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className={`size-2 rounded-full ${MEDIA_DOT[m.type] ?? "bg-blue-300"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-3">
          <h4 className="text-[13px] font-bold text-n900 line-clamp-2 leading-snug group-hover:text-caci-blue transition-colors">
            {sermon.title}
          </h4>
          <p className="text-[11px] text-n500 mt-1.5 flex items-center gap-1 truncate">
            <Mic size={10} className="shrink-0" /> {sermon.speaker}
          </p>
          <p className="text-[11px] text-n400 mt-0.5 flex items-center gap-1">
            <Calendar size={10} className="shrink-0" /> {formatDate(sermon.date)}
          </p>
          {sermon.durationSeconds && (
            <p className="text-[11px] text-n400 mt-0.5 flex items-center gap-1">
              <Clock size={10} className="shrink-0" /> {formatDuration(sermon.durationSeconds)}
            </p>
          )}
        </div>
      </div>

      {/* Single "Open" text button below the card */}
      <button
        onClick={onView}
        className="w-full mt-2 py-1.5 text-[12px] font-semibold text-caci-blue hover:text-[#003578] hover:bg-caci-blue-bg rounded-xl transition-all duration-150 text-center"
      >
        Open →
      </button>
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
