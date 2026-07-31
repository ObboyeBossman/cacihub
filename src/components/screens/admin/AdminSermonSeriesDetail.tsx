"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Music, Video, ChevronUp, ChevronDown,
  BookOpen, Calendar, Mic, Layers, AlertCircle, CheckCircle2,
  Clock, MoreVertical,
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

    // Optimistic UI
    const updated = [...sermons];
    const aSeq = updated[idx].sequence;
    const bSeq = updated[swapIdx].sequence;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    updated[idx] = { ...updated[idx], sequence: aSeq };
    updated[swapIdx] = { ...updated[swapIdx], sequence: bSeq };
    setSermons(updated);

    try {
      // Swap sequences
      const a = sermons[idx];
      const b = sermons[swapIdx];
      await Promise.all([
        api.sermons.update(a.id, { sequence: b.sequence }),
        api.sermons.update(b.id, { sequence: a.sequence }),
      ]);
    } catch (e: any) {
      toast.error("Reorder failed");
      await load(); // revert
    }
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
          <CACISkeleton className="h-32 w-full rounded-lg" />
          <CACISkeleton className="h-6 w-1/2" />
          <CACISkeleton className="h-48 w-full" />
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

  return (
    <>
      <MobileHeader title={series.title} onBack={back} />
      <DesktopTopBar
        title={series.title}
        subtitle={`${series.year} · ${series.sermonCount ?? sermons?.length ?? 0} sermon${(series.sermonCount ?? sermons?.length ?? 0) !== 1 ? "s" : ""}`}
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

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-5xl space-y-6">

        {/* Series header card */}
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
                  {/* Mobile edit button */}
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

        {/* Sermons list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionHeading title={`Sermons (${sermons?.length ?? 0})`} />
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteSeriesOpen(true)}
                className="text-[12px] text-caci-red hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} /> Delete series
              </button>
            </div>
          </div>

          {/* Mobile add */}
          <div className="md:hidden mb-3">
            <CACIButton className="w-full" leftIcon={<Plus size={16} />} onClick={addSermon}>
              Add Sermon
            </CACIButton>
          </div>

          {(!sermons || sermons.length === 0) ? (
            <EmptyState
              icon={<BookOpen size={26} />}
              title="No sermons in this series yet"
              description="Add your first sermon to this series."
              action={<CACIButton leftIcon={<Plus size={16} />} onClick={addSermon}>Add Sermon</CACIButton>}
            />
          ) : (
            <div className="space-y-2">
              {sermons.map((sermon, idx) => (
                <SermonRow
                  key={sermon.id}
                  sermon={sermon}
                  isFirst={idx === 0}
                  isLast={idx === sermons.length - 1}
                  onEdit={() => editSermon(sermon)}
                  onDelete={() => setDeleteSermonId(sermon.id)}
                  onMoveUp={() => handleReorder(sermon.id, "up")}
                  onMoveDown={() => handleReorder(sermon.id, "down")}
                />
              ))}
            </div>
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

// ── Sub-components ─────────────────────────────────────────

function SermonRow({
  sermon, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown,
}: {
  sermon: SermonDTO;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <CACICard padding="none" className="overflow-hidden group">
      <div className="flex items-stretch">
        {/* Sequence + reorder */}
        <div className="w-10 shrink-0 flex flex-col items-center justify-center bg-n50 border-r border-n100 py-2 gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded hover:bg-n200 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp size={14} className="text-n500" />
          </button>
          <span className="text-[11px] font-mono font-semibold text-n600">{sermon.sequence}</span>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded hover:bg-n200 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown size={14} className="text-n500" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-n900 text-[14px] line-clamp-1">{sermon.title}</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                <span className="flex items-center gap-1 text-[12px] text-n500">
                  <Mic size={11} /> {sermon.speaker}
                </span>
                <span className="flex items-center gap-1 text-[12px] text-n400">
                  <Calendar size={11} /> {formatDate(sermon.date)}
                </span>
                {sermon.scriptureReference && (
                  <span className="text-[12px] text-n400 italic hidden md:block">
                    📖 {sermon.scriptureReference}
                  </span>
                )}
              </div>
            </div>
            {/* Media badges */}
            <div className="flex items-center gap-1 shrink-0">
              {sermon.audioUrl && (
                <span className="size-6 rounded-full bg-caci-blue-bg flex items-center justify-center">
                  <Music size={12} className="text-caci-blue" />
                </span>
              )}
              {sermon.videoUrl && (
                <span className="size-6 rounded-full bg-caci-red-bg flex items-center justify-center">
                  <Video size={12} className="text-caci-red" />
                </span>
              )}
              {sermon.durationSeconds && (
                <span className="text-[11px] text-n400 font-mono hidden md:block">
                  {formatDuration(sermon.durationSeconds)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-1 px-3 border-l border-n100">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-caci-blue-bg hover:text-caci-blue transition-colors text-n400"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-caci-red-bg hover:text-caci-red transition-colors text-n400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </CACICard>
  );
}

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
        className="bg-white rounded-t-2xl md:rounded-xl max-w-md w-full p-5 md:p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${danger ? "bg-caci-red-bg" : "bg-caci-blue-bg"}`}>
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
