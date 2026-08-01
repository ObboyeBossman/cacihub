"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Pencil, Trash2, Music, Video, FileText, ImageIcon,
  BookOpen, Calendar, Mic, AlertCircle, Clock, Layers,
  ExternalLink, Presentation,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO, SermonMediaDTO } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/format";
import { normaliseCoverUrl } from "@/lib/utils";
import {
  CACIButton, CACICard, CACISkeleton, EmptyState,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";

// ── Media type config ─────────────────────────────────────────
const MEDIA_CONFIG: Record<string, {
  icon: React.ReactNode;
  label: string;
  bg: string;
  text: string;
  border: string;
}> = {
  audio: {
    icon: <Music size={18} />,
    label: "Audio",
    bg: "bg-blue-50",
    text: "text-caci-blue",
    border: "border-blue-100",
  },
  video: {
    icon: <Video size={18} />,
    label: "Video",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
  },
  document: {
    icon: <FileText size={18} />,
    label: "Document",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  image: {
    icon: <ImageIcon size={18} />,
    label: "Image",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  slides: {
    icon: <Presentation size={18} />,
    label: "Slides",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
};

export function AdminSermonDetail() {
  const { params, back, navigate, setParam } = useApp();
  const sermonId = params.sermonId;

  const [sermon, setSermon] = useState<SermonDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sermonId) { back(); return; }
    try {
      const res = await api.sermons.get(sermonId);
      setSermon(res.sermon);
    } catch {
      setSermon(null);
    } finally {
      setLoading(false);
    }
  }, [sermonId, back]);

  useEffect(() => { load(); }, [load]);

  function handleEdit() {
    navigate("admin-sermon-edit");
  }

  async function handleDelete() {
    if (!sermonId) return;
    setDeleteBusy(true);
    try {
      await api.sermons.remove(sermonId);
      toast.success("Sermon deleted");
      back();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete sermon");
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <MobileHeader title="Sermon" onBack={back} />
        <DesktopTopBar title="Sermon Detail" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4">
          <CACISkeleton className="h-48 w-full rounded-xl" />
          <CACISkeleton className="h-6 w-2/3" />
          <CACISkeleton className="h-4 w-1/2" />
          <CACISkeleton className="h-24 w-full" />
        </div>
      </>
    );
  }

  if (!sermon) {
    return (
      <>
        <MobileHeader title="Sermon" onBack={back} />
        <DesktopTopBar title="Sermon Detail" />
        <EmptyState
          title="Sermon not found"
          description="This sermon may have been deleted."
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  const speakerInitial = sermon.speaker.charAt(0).toUpperCase();
  const coverUrl = sermon.coverImageUrl ? normaliseCoverUrl(sermon.coverImageUrl) : null;

  return (
    <>
      <MobileHeader
        title={sermon.title}
        onBack={back}
        actions={
          <button
            onClick={handleEdit}
            className="p-2 rounded-lg hover:bg-white/20 active:bg-white/30 transition-colors"
          >
            <Pencil size={18} className="text-white" />
          </button>
        }
      />
      <DesktopTopBar
        title={sermon.title}
        subtitle={sermon.seriesTitle ?? undefined}
        action={
          <div className="flex gap-2">
            <CACIButton
              variant="secondary"
              size="sm"
              leftIcon={<Pencil size={14} />}
              onClick={handleEdit}
            >
              Edit Sermon
            </CACIButton>
            <CACIButton
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </CACIButton>
          </div>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-5">

        {/* Hero card */}
        <CACICard padding="none" className="overflow-hidden">
          {/* Cover / gradient header */}
          <div className="relative h-44 bg-gradient-to-br from-[#1a3a6b] to-caci-blue flex items-end">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={sermon.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Layers size={80} className="text-white" />
              </div>
            )}
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Sequence badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/30">
                #{sermon.sequence}
              </span>
            </div>

            {/* Speaker avatar */}
            <div className="absolute top-4 right-4">
              <div className="size-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
                <span className="text-white font-bold text-[16px]">{speakerInitial}</span>
              </div>
            </div>
          </div>

          {/* Meta section */}
          <div className="p-4 md:p-5">
            <h1 className="text-[20px] md:text-[22px] font-bold text-n900 leading-tight">
              {sermon.title}
            </h1>
            {sermon.theme && (
              <p className="text-[14px] text-caci-blue font-medium mt-1">{sermon.theme}</p>
            )}

            {/* Quick-facts row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
              <span className="flex items-center gap-1.5 text-[13px] text-n600">
                <Mic size={13} className="text-n400 shrink-0" />
                {sermon.speaker}
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-n500">
                <Calendar size={13} className="text-n400 shrink-0" />
                {formatDate(sermon.date)}
              </span>
              {sermon.durationSeconds && (
                <span className="flex items-center gap-1.5 text-[13px] text-n500">
                  <Clock size={13} className="text-n400 shrink-0" />
                  {formatDuration(sermon.durationSeconds)}
                </span>
              )}
              {sermon.scriptureReference && (
                <span className="flex items-center gap-1.5 text-[13px] text-n500 italic">
                  <BookOpen size={13} className="text-n400 shrink-0" />
                  {sermon.scriptureReference}
                </span>
              )}
            </div>

            {sermon.description && (
              <p className="mt-4 text-[14px] text-n600 leading-relaxed border-t border-n100 pt-4">
                {sermon.description}
              </p>
            )}
          </div>
        </CACICard>

        {/* Media section */}
        {sermon.media && sermon.media.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold text-n400 uppercase tracking-wider mb-3">
              Media ({sermon.media.length})
            </p>
            <div className="space-y-2">
              {sermon.media
                .sort((a, b) => a.sequence - b.sequence)
                .map((item) => (
                  <MediaItem key={item.id} item={item} />
                ))}
            </div>
          </div>
        )}

        {/* Mobile actions */}
        <div className="md:hidden flex flex-col gap-3 pt-2 pb-8">
          <CACIButton
            leftIcon={<Pencil size={16} />}
            onClick={handleEdit}
          >
            Edit Sermon
          </CACIButton>
          <CACIButton
            variant="danger"
            leftIcon={<Trash2 size={16} />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete Sermon
          </CACIButton>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteOpen && (
        <DeleteModal
          title={`Delete "${sermon.title}"?`}
          description="This sermon and all its media links will be permanently removed. This cannot be undone."
          onCancel={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          busy={deleteBusy}
        />
      )}
    </>
  );
}

// ── MediaItem ─────────────────────────────────────────────────
function MediaItem({ item }: { item: SermonMediaDTO }) {
  const cfg = MEDIA_CONFIG[item.type] ?? MEDIA_CONFIG.audio;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg} hover:brightness-95 active:brightness-90 transition-all group`}
    >
      <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-n800 line-clamp-1">
          {item.label || cfg.label}
        </p>
        <p className="text-[12px] text-n400 line-clamp-1 mt-0.5">{item.url}</p>
      </div>
      <ExternalLink size={14} className="text-n400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

// ── DeleteModal ───────────────────────────────────────────────
function DeleteModal({
  title, description, onCancel, onConfirm, busy,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
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
        <div className="size-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <AlertCircle size={20} className="text-caci-red" />
        </div>
        <h3 className="text-[16px] font-bold text-n900">{title}</h3>
        <p className="text-[14px] text-n500 mt-1.5 leading-relaxed">{description}</p>
        <div className="flex gap-3 mt-5">
          <CACIButton variant="secondary" className="flex-1" onClick={onCancel} disabled={busy}>
            Cancel
          </CACIButton>
          <CACIButton
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            loading={busy}
          >
            Delete Sermon
          </CACIButton>
        </div>
      </div>
    </div>
  );
}
