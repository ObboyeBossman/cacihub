"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Music, Video, FileText, ImageIcon, ChevronUp, ChevronDown,
  BookOpen, Calendar, Mic, Layers, AlertCircle, Clock, MoreVertical, Presentation,
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

// ── Media type dots config ────────────────────────────────────
const MEDIA_DOT: Record<string, string> = {
  audio:    "bg-caci-blue",
  video:    "bg-amber-500",
  document: "bg-emerald-500",
  image:    "bg-purple-500",
  slides:   "bg-orange-500",
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

  async function handleReorder(sermonId: string, direction: "up" | "down") {
    if (!sermons) return;
    const idx = sermons.findIndex((s) => s.id === sermonId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sermons.length) return;

    const updated = [...sermons];
    const aSeq = updated[idx].sequence;
    const bSeq = updated[swapIdx].sequence;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    updated[idx] = { ...updated[idx], sequence: aSeq };
    updated[swapIdx] = { ...updated[swapIdx], sequence: bSeq };
    setSermons(updated);

    try {
      const a = sermons[idx];
      const b = sermons[swapIdx];
      await Promise.all([
        api.sermons.update(a.id, { sequence: b.sequence }),
        api.sermons.update(b.id, { sequence: a.sequence }),
      ]);
    } catch {
      toast.error("Reorder failed");
      await load();
    }
  }

  function openSermonDetail(sermon: SermonDTO) {
    setParam("sermonId", sermon.id);
    navigate("admin-sermon-detail");
  }

  function editSermon(sermon: SermonDTO) {
    setParam("sermonId", sermon.id);
    navigate("admin-sermon-edit");
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
              <CACISkeleton key={i} className="h-52 w-44 shrink-0 rounded-xl" />
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

  return (
    <>
      <MobileHeader title={series.title} onBack={back} />
      <DesktopTopBar
        title={series.title}
        subtitle={`${series.year} · ${sermonCount} sermon${sermonCount !== 1 ? "s" : ""}`}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" leftIcon={<Pencil size={14} />} onClick={editSeries}>
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
                {series.coverImage ? (
                  <img src={normaliseCoverUrl(series.coverImage)!} alt={series.title} className="w-full h-full object-cover absolute inset-0" />
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
              {/* Warm compact Add button — replaces the old full-width red one */}
              <button
                onClick={addSermon}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 px-3 py-1.5 rounded-full transition-all duration-150"
              >
                <Plus size={14} />
                Add sermon
              </button>
              <button
                onClick={() => setDeleteSeriesOpen(true)}
                className="text-[12px] text-n400 hover:text-caci-red flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} /> Delete series
              </button>
            </div>
          </div>

          {/* Sermon cards — horizontal scroll */}
          {(!sermons || sermons.length === 0) ? (
            <div className="px-4 md:px-8">
              <EmptyState
                icon={<BookOpen size={26} />}
                title="No sermons in this series yet"
                description="Add your first sermon to get started."
                action={
                  <button
                    onClick={addSermon}
                    className="flex items-center gap-2 text-[14px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2.5 rounded-full transition-all"
                  >
                    <Plus size={15} />
                    Add first sermon
                  </button>
                }
              />
            </div>
          ) : (
            <div
              className="flex gap-3 overflow-x-auto pb-4 px-4 md:px-8 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {sermons.map((sermon, idx) => (
                <SermonCard
                  key={sermon.id}
                  sermon={sermon}
                  isFirst={idx === 0}
                  isLast={idx === sermons.length - 1}
                  onView={() => openSermonDetail(sermon)}
                  onEdit={() => editSermon(sermon)}
                  onDelete={() => setDeleteSermonId(sermon.id)}
                  onMoveUp={() => handleReorder(sermon.id, "up")}
                  onMoveDown={() => handleReorder(sermon.id, "down")}
                />
              ))}

              {/* Inline "add" trailing card */}
              <button
                onClick={addSermon}
                className="w-40 shrink-0 snap-start rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 hover:border-amber-300 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[200px] group"
              >
                <div className="size-10 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors flex items-center justify-center">
                  <Plus size={20} className="text-amber-600" />
                </div>
                <span className="text-[12px] font-semibold text-amber-700">Add sermon</span>
              </button>
            </div>
          )}
        </div>

        {/* Reorder list — visible on desktop for precise ordering */}
        {sermons && sermons.length > 1 && (
          <div className="hidden md:block px-4 md:px-8">
            <p className="text-[12px] font-semibold text-n400 uppercase tracking-wider mb-3">Reorder</p>
            <div className="space-y-2">
              {sermons.map((sermon, idx) => (
                <ReorderRow
                  key={sermon.id}
                  sermon={sermon}
                  isFirst={idx === 0}
                  isLast={idx === sermons.length - 1}
                  onMoveUp={() => handleReorder(sermon.id, "up")}
                  onMoveDown={() => handleReorder(sermon.id, "down")}
                />
              ))}
            </div>
          </div>
        )}
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

// ── SermonCard — horizontal scroll item ──────────────────────
function SermonCard({
  sermon, isFirst, isLast, onView, onEdit, onDelete, onMoveUp, onMoveDown,
}: {
  sermon: SermonDTO;
  isFirst: boolean;
  isLast: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const speakerInitial = sermon.speaker.charAt(0).toUpperCase();
  const hasMedia = sermon.media && sermon.media.length > 0;

  return (
    <div className="w-44 shrink-0 snap-start">
      {/* Clickable card */}
      <button
        onClick={onView}
        className="w-full text-left rounded-2xl overflow-hidden border border-n100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 active:shadow-sm transition-all duration-200 group"
      >
        {/* Card image / gradient header */}
        <div className="h-28 bg-gradient-to-br from-[#1a3a6b] to-caci-blue relative flex items-end">
          {/* Sequence badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[10px] font-bold text-white/70 bg-black/20 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
              #{sermon.sequence}
            </span>
          </div>
          {/* Speaker initial avatar — signature detail */}
          <div className="absolute top-2.5 right-2.5 size-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">{speakerInitial}</span>
          </div>
          {/* Media type dots */}
          {hasMedia && (
            <div className="absolute bottom-2.5 right-2.5 flex gap-1">
              {sermon.media.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className={`size-2 rounded-full ${MEDIA_DOT[m.type] ?? "bg-n300"}`}
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
      </button>

      {/* Quick action row below card */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded-md hover:bg-n100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Move up"
          >
            <ChevronUp size={13} className="text-n500" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded-md hover:bg-n100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Move down"
          >
            <ChevronDown size={13} className="text-n500" />
          </button>
        </div>
        <div className="flex gap-0.5">
          <button
            onClick={onEdit}
            className="p-1 rounded-md hover:bg-caci-blue-bg text-n400 hover:text-caci-blue transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-md hover:bg-caci-red-bg text-n400 hover:text-caci-red transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ReorderRow — desktop-only reorder list ────────────────────
function ReorderRow({
  sermon, isFirst, isLast, onMoveUp, onMoveDown,
}: {
  sermon: SermonDTO;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white border border-n100 rounded-xl px-4 py-3">
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0.5 rounded hover:bg-n100 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronUp size={14} className="text-n500" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0.5 rounded hover:bg-n100 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronDown size={14} className="text-n500" />
        </button>
      </div>
      <span className="text-[11px] font-mono font-bold text-n400 w-5 text-center">{sermon.sequence}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-n900 truncate">{sermon.title}</p>
        <p className="text-[12px] text-n400 truncate">{sermon.speaker} · {formatDate(sermon.date)}</p>
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
