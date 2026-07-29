"use client";

import { useState } from "react";
import {
  BookOpen, Calendar, Mic, Music, Video, Image as ImageIcon,
  Info, Plus, Trash2, Clock, Tag, Hash,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO, SermonQuotation } from "@/lib/types";
import { formatDuration, parseDurationToSeconds } from "@/lib/format";
import {
  CACIButton, CACIInput, CACITextarea, CACICard, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";

interface Props {
  /** When provided, screen is in edit mode */
  existing?: SermonDTO;
}

export function AdminSermonAdd({ existing }: Props) {
  const { back, params } = useApp();
  const isEdit = !!existing;

  // Core fields
  const [title, setTitle] = useState(existing?.title ?? "");
  const [speaker, setSpeaker] = useState(existing?.speaker ?? "");
  const [date, setDate] = useState(
    existing?.date
      ? existing.date.slice(0, 10)
      : new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(existing?.description ?? "");
  const [theme, setTheme] = useState(existing?.theme ?? "");
  const [scriptureReference, setScriptureReference] = useState(existing?.scriptureReference ?? "");
  const [sequence, setSequence] = useState(String(existing?.sequence ?? ""));
  const [duration, setDuration] = useState(
    existing?.durationSeconds ? formatDuration(existing.durationSeconds) : ""
  );

  // Media
  const [audioUrl, setAudioUrl] = useState(existing?.audioUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(existing?.coverImageUrl ?? "");

  // Quotations
  const [quotations, setQuotations] = useState<SermonQuotation[]>(
    existing?.quotations?.length
      ? existing.quotations
      : []
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The series context comes from params when navigating from SeriesDetail
  const seriesId = existing?.seriesId ?? params.seriesId ?? null;

  function addQuotation() {
    setQuotations((q) => [...q, { reference: "", text: "" }]);
  }

  function updateQuotation(i: number, field: keyof SermonQuotation, value: string) {
    setQuotations((q) => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function removeQuotation(i: number) {
    setQuotations((q) => q.filter((_, idx) => idx !== i));
  }

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) { setError("Title is required."); return; }
    if (!speaker.trim()) { setError("Speaker is required."); return; }
    if (!date) { setError("Date is required."); return; }

    setSaving(true);
    try {
      const cleanQuotations = quotations.filter((q) => q.reference.trim() || q.text.trim());
      const durationSeconds = parseDurationToSeconds(duration);
      const seqNum = sequence.trim() ? parseInt(sequence, 10) : undefined;

      const payload = {
        title: title.trim(),
        speaker: speaker.trim(),
        date,
        description: description.trim() || undefined,
        theme: theme.trim() || undefined,
        scriptureReference: scriptureReference.trim() || undefined,
        audioUrl: audioUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
        quotations: cleanQuotations,
        durationSeconds: durationSeconds ?? undefined,
        sequence: seqNum,
        ...(seriesId ? { seriesId } : {}),
      };

      if (isEdit && existing) {
        await api.sermons.update(existing.id, payload);
        toast.success("Sermon updated");
      } else {
        await api.sermons.create(payload);
        toast.success("Sermon added to the library");
      }
      back();
    } catch (e: any) {
      const msg = e?.message || `Failed to ${isEdit ? "update" : "add"} sermon`;
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isEdit ? "Edit Sermon" : "Add Sermon";
  const saveLabel = isEdit ? "Save Changes" : "Add Sermon";

  return (
    <>
      <MobileHeader title={pageTitle} onBack={back} />
      <DesktopTopBar
        title={pageTitle}
        subtitle={isEdit ? `Editing "${existing!.title}"` : "Record a new message or teaching"}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" onClick={back}>Cancel</CACIButton>
            <CACIButton size="sm" loading={saving} onClick={handleSave}>{saveLabel}</CACIButton>
          </div>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">

        {/* Core Details */}
        <CACICard>
          <SectionHeading title="Sermon Details" className="mb-4" />
          <div className="space-y-4">
            <CACIInput
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Power of the Cross"
              leftIcon={<BookOpen size={16} />}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CACIInput
                label="Speaker"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g. Pastor Emmanuel Mensah"
                leftIcon={<Mic size={16} />}
                required
              />
              <CACIInput
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                leftIcon={<Calendar size={16} />}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CACIInput
                label="Theme (optional)"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Faith and Perseverance"
                leftIcon={<Tag size={16} />}
              />
              <CACIInput
                label="Scripture Reference (optional)"
                value={scriptureReference}
                onChange={(e) => setScriptureReference(e.target.value)}
                placeholder="e.g. 1 Corinthians 1:18"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CACIInput
                label="Sequence in series (optional)"
                type="number"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                placeholder="e.g. 3"
                leftIcon={<Hash size={16} />}
              />
              <CACIInput
                label="Duration (optional)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="mm:ss or h:mm:ss"
                leftIcon={<Clock size={16} />}
              />
            </div>
            <CACITextarea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short summary of the message…"
              className="min-h-[100px]"
            />
          </div>
        </CACICard>

        {/* Quotations */}
        <CACICard>
          <div className="flex items-center justify-between mb-4">
            <SectionHeading title="Quotations (optional)" />
            <CACIButton
              variant="ghost"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={addQuotation}
            >
              Add
            </CACIButton>
          </div>
          {quotations.length === 0 ? (
            <p className="text-[13px] text-n400 text-center py-2">
              No quotations added. Click "Add" to include a notable quote.
            </p>
          ) : (
            <div className="space-y-3">
              {quotations.map((q, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <CACIInput
                      placeholder="Reference (e.g. "Faith is…" — C.S. Lewis)"
                      value={q.reference}
                      onChange={(e) => updateQuotation(i, "reference", e.target.value)}
                      containerClassName="mb-0"
                    />
                    <CACITextarea
                      placeholder="Full quotation text…"
                      value={q.text}
                      onChange={(e) => updateQuotation(i, "text", e.target.value)}
                      className="min-h-[64px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuotation(i)}
                    className="mt-1 p-1.5 rounded-md text-n400 hover:text-caci-red hover:bg-caci-red-bg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CACICard>

        {/* Media Links */}
        <CACICard>
          <SectionHeading title="Media Links (optional)" className="mb-4" />
          <div className="space-y-4">
            <CACIInput
              label="Audio URL"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://…mp3"
              leftIcon={<Music size={16} />}
            />
            <CACIInput
              label="Video URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/…"
              leftIcon={<Video size={16} />}
            />
            <CACIInput
              label="Cover Image URL"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://….jpg"
              leftIcon={<ImageIcon size={16} />}
            />
          </div>
        </CACICard>

        {error && (
          <div className="bg-caci-red-bg border border-caci-red/20 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-caci-red shrink-0 mt-0.5" />
            <p className="text-[14px] text-caci-red">{error}</p>
          </div>
        )}

        {/* Mobile save bar */}
        <div className="md:hidden flex gap-3 pt-2 pb-6">
          <CACIButton variant="secondary" className="flex-1" onClick={back}>Cancel</CACIButton>
          <CACIButton className="flex-1" loading={saving} onClick={handleSave}>{saveLabel}</CACIButton>
        </div>
      </div>
    </>
  );
}
