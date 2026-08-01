"use client";

import { useState, useRef } from "react";
import {
  BookOpen, Calendar, Mic, Image as ImageIcon,
  Info, Plus, Trash2, Clock, Tag, Hash,
  Music, Video, FileText, Upload, X, Link, GripVertical,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO, SermonQuotation, SermonMediaType } from "@/lib/types";
import { formatDuration, parseDurationToSeconds } from "@/lib/format";
import { normaliseCoverUrl, cn } from "@/lib/utils";
import {
  CACIButton, CACIInput, CACITextarea, CACICard, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";

interface Props {
  existing?: SermonDTO;
}

interface MediaItem {
  id: string; // local key only
  type: SermonMediaType;
  url: string;
  label: string;
}

const MEDIA_TYPE_META: Record<SermonMediaType, { label: string; icon: React.ReactNode; placeholder: string }> = {
  audio:    { label: "Audio",    icon: <Music    size={15} />, placeholder: "https://…mp3" },
  video:    { label: "Video",    icon: <Video    size={15} />, placeholder: "https://youtube.com/…" },
  document: { label: "Document", icon: <FileText size={15} />, placeholder: "https://…pdf" },
  image:    { label: "Image",    icon: <ImageIcon size={15} />, placeholder: "https://….jpg" },
};

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function AdminSermonAdd({ existing }: Props) {
  const { back, params } = useApp();
  const isEdit = !!existing;

  // Core fields
  const [title, setTitle]                     = useState(existing?.title ?? "");
  const [speaker, setSpeaker]                 = useState(existing?.speaker ?? "");
  const [date, setDate]                       = useState(
    existing?.date ? existing.date.slice(0, 10) : new Date().toISOString().split("T")[0]
  );
  const [description, setDescription]         = useState(existing?.description ?? "");
  const [theme, setTheme]                     = useState(existing?.theme ?? "");
  const [scriptureReference, setScriptureRef] = useState(existing?.scriptureReference ?? "");
  const [sequence, setSequence]               = useState(String(existing?.sequence ?? ""));
  const [duration, setDuration]               = useState(
    existing?.durationSeconds ? formatDuration(existing.durationSeconds) : ""
  );

  // Media list
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    existing?.media?.map((m) => ({ id: makeId(), type: m.type as SermonMediaType, url: m.url, label: m.label ?? "" })) ?? []
  );

  // Cover image
  const initialPreview = normaliseCoverUrl(existing?.coverImageUrl ?? null);
  const [coverImageUrl, setCoverImageUrl]   = useState(existing?.coverImageUrl ?? "");
  const [coverMode, setCoverMode]           = useState<"url" | "file">("url");
  const [previewSrc, setPreviewSrc]         = useState<string | null>(initialPreview);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState(false);
  const [uploading, setUploading]           = useState(false);
  const fileRef                             = useRef<HTMLInputElement>(null);
  const objectUrlRef                        = useRef<string | null>(null);

  // Quotations
  const [quotations, setQuotations] = useState<SermonQuotation[]>(existing?.quotations ?? []);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const seriesId = existing?.seriesId ?? params.seriesId ?? null;

  // ── Media helpers ────────────────────────────────────────────────
  function addMedia() {
    setMediaItems((prev) => [...prev, { id: makeId(), type: "audio", url: "", label: "" }]);
  }
  function updateMedia(id: string, field: keyof Omit<MediaItem, "id">, value: string) {
    setMediaItems((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
  }
  function removeMedia(id: string) {
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
  }

  // ── Cover image upload ───────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewSrc(objectUrl);
    setPreviewLoading(true);
    setPreviewError(false);
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "sermon-covers");
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setCoverImageUrl(data.url);
      setPreviewSrc(data.url);
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      toast.success("Cover image uploaded");
    } catch (err: any) {
      setError(err.message ?? "Image upload failed");
      toast.error(err.message ?? "Image upload failed");
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      setPreviewSrc(null);
      setCoverImageUrl("");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  function clearCover() {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    setCoverImageUrl(""); setPreviewSrc(null); setPreviewLoading(false); setPreviewError(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Quotations ───────────────────────────────────────────────────
  function addQuotation()    { setQuotations((q) => [...q, { reference: "", text: "" }]); }
  function updateQuotation(i: number, field: keyof SermonQuotation, value: string) {
    setQuotations((q) => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function removeQuotation(i: number) { setQuotations((q) => q.filter((_, idx) => idx !== i)); }

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError(null);
    if (!title.trim())   { setError("Title is required.");   return; }
    if (!speaker.trim()) { setError("Speaker is required."); return; }
    if (!date)           { setError("Date is required.");    return; }
    if (uploading)       { setError("Please wait for the image to finish uploading."); return; }

    const invalidMedia = mediaItems.find((m) => !m.url.trim());
    if (invalidMedia) { setError("Every media item needs a URL."); return; }

    setSaving(true);
    try {
      const cleanQuotations  = quotations.filter((q) => q.reference.trim() || q.text.trim());
      const durationSeconds  = parseDurationToSeconds(duration);
      const seqNum           = sequence.trim() ? parseInt(sequence, 10) : undefined;

      const payload = {
        title:             title.trim(),
        speaker:           speaker.trim(),
        date,
        description:       description.trim() || undefined,
        theme:             theme.trim() || undefined,
        scriptureReference: scriptureReference.trim() || undefined,
        coverImageUrl:     coverImageUrl.trim() || undefined,
        quotations:        cleanQuotations,
        media:             mediaItems.map((m, i) => ({ type: m.type, url: m.url.trim(), label: m.label.trim() || null, sequence: i })),
        durationSeconds:   durationSeconds ?? undefined,
        sequence:          seqNum,
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

        {/* ── Sermon Details ───────────────────────────────────────── */}
        <CACICard>
          <SectionHeading title="Sermon Details" className="mb-4" />
          <div className="space-y-4">
            <CACIInput label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Power of the Cross" leftIcon={<BookOpen size={16} />} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CACIInput label="Speaker" value={speaker} onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g. Pastor Emmanuel Mensah" leftIcon={<Mic size={16} />} required />
              <CACIInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
                leftIcon={<Calendar size={16} />} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CACIInput label="Theme (optional)" value={theme} onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Faith and Perseverance" leftIcon={<Tag size={16} />} />
              <CACIInput label="Scripture Reference (optional)" value={scriptureReference}
                onChange={(e) => setScriptureRef(e.target.value)} placeholder="e.g. 1 Corinthians 1:18" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CACIInput label="Sequence in series (optional)" type="number" value={sequence}
                onChange={(e) => setSequence(e.target.value)} placeholder="e.g. 3" leftIcon={<Hash size={16} />} />
              <CACIInput label="Duration (optional)" value={duration} onChange={(e) => setDuration(e.target.value)}
                placeholder="mm:ss or h:mm:ss" leftIcon={<Clock size={16} />} />
            </div>
            <CACITextarea label="Description (optional)" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short summary of the message…" className="min-h-[100px]" />
          </div>
        </CACICard>

        {/* ── Media ────────────────────────────────────────────────── */}
        <CACICard>
          <div className="flex items-center justify-between mb-1">
            <SectionHeading title="Media" />
            <CACIButton variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={addMedia}>
              Add
            </CACIButton>
          </div>
          <p className="text-[12px] text-n400 mb-4">
            Audio recordings, video links, presentation slides, or any related files.
          </p>

          {mediaItems.length === 0 ? (
            <button
              type="button"
              onClick={addMedia}
              className="w-full border-2 border-dashed border-n200 rounded-xl py-8 flex flex-col items-center gap-2 text-n400 hover:border-caci-blue hover:text-caci-blue hover:bg-caci-blue/5 transition-all duration-150"
            >
              <Plus size={22} />
              <span className="text-[13px] font-medium">Add media</span>
              <span className="text-[12px]">Audio · Video · Document · Image</span>
            </button>
          ) : (
            <div className="space-y-3">
              {mediaItems.map((item, idx) => {
                const meta = MEDIA_TYPE_META[item.type];
                return (
                  <div
                    key={item.id}
                    className="flex gap-2 items-start p-3 rounded-xl bg-n50 border border-n100"
                  >
                    {/* Drag handle — visual only for now */}
                    <div className="mt-2.5 text-n300 shrink-0">
                      <GripVertical size={16} />
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      {/* Type selector */}
                      <div className="flex gap-1.5 flex-wrap">
                        {(Object.keys(MEDIA_TYPE_META) as SermonMediaType[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateMedia(item.id, "type", t)}
                            className={cn(
                              "flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-lg font-medium transition-all duration-120",
                              item.type === t
                                ? "bg-caci-blue text-white shadow-sm"
                                : "bg-white border border-n200 text-n500 hover:border-caci-blue hover:text-caci-blue"
                            )}
                          >
                            {MEDIA_TYPE_META[t].icon}
                            {MEDIA_TYPE_META[t].label}
                          </button>
                        ))}
                      </div>

                      {/* URL */}
                      <CACIInput
                        value={item.url}
                        onChange={(e) => updateMedia(item.id, "url", e.target.value)}
                        placeholder={meta.placeholder}
                        leftIcon={<Link size={14} />}
                      />

                      {/* Label */}
                      <CACIInput
                        value={item.label}
                        onChange={(e) => updateMedia(item.id, "label", e.target.value)}
                        placeholder={`Label (optional) — e.g. "Part ${idx + 1}"`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      className="mt-2.5 p-1.5 rounded-lg text-n400 hover:text-caci-red hover:bg-caci-red-bg transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CACICard>

        {/* ── Cover Image ──────────────────────────────────────────── */}
        <CACICard>
          <SectionHeading title="Cover Image" className="mb-1" />
          <p className="text-[12px] text-n400 mb-4">Optional. Shown on the sermon card for members.</p>

          <div className="flex items-center gap-1 mb-3">
            {(["url", "file"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCoverMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg font-medium transition-all duration-120",
                  coverMode === mode
                    ? "bg-caci-blue text-white"
                    : "text-n500 hover:text-n700 border border-n200 bg-white"
                )}
              >
                {mode === "url" ? <Link size={11} /> : <Upload size={11} />}
                {mode === "url" ? "Paste URL" : "Upload"}
              </button>
            ))}
          </div>

          {coverMode === "url" ? (
            <CACIInput
              value={coverImageUrl}
              onChange={(e) => { setCoverImageUrl(e.target.value); setPreviewSrc(e.target.value || null); setPreviewError(false); }}
              placeholder="https://….jpg"
              leftIcon={<ImageIcon size={16} />}
            />
          ) : (
            <div className="space-y-2">
              {previewSrc && !previewError && (
                <div className="relative rounded-xl overflow-hidden bg-n100 aspect-video">
                  {previewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-n100">
                      <div className="size-6 border-2 border-caci-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <img
                    src={previewSrc} alt="Cover preview"
                    className={cn("w-full h-full object-cover transition-opacity", previewLoading ? "opacity-0" : "opacity-100")}
                    onLoad={() => setPreviewLoading(false)}
                    onError={() => { setPreviewError(true); setPreviewLoading(false); }}
                  />
                  <button
                    type="button" onClick={clearCover}
                    className="absolute top-2 right-2 size-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
              <button
                type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className={cn(
                  "w-full border-2 border-dashed rounded-xl px-4 py-5 flex flex-col items-center gap-2 transition-all duration-150",
                  uploading
                    ? "border-caci-blue/40 bg-caci-blue/5 cursor-wait"
                    : "border-n200 hover:border-caci-blue hover:bg-caci-blue/5 cursor-pointer"
                )}
              >
                {uploading ? (
                  <><div className="size-6 border-2 border-caci-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-[13px] text-caci-blue font-medium">Uploading…</p></>
                ) : (
                  <><Upload size={20} className="text-n400" />
                  <p className="text-[13px] text-n500">{previewSrc && !previewError ? "Replace image" : "Tap to choose an image"}</p>
                  <p className="text-[11px] text-n400">JPEG · PNG · WebP · max 5 MB</p></>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden" onChange={handleFileChange} />
            </div>
          )}
        </CACICard>

        {/* ── Quotations ───────────────────────────────────────────── */}
        <CACICard>
          <div className="flex items-center justify-between mb-4">
            <SectionHeading title="Quotations (optional)" />
            <CACIButton variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={addQuotation}>Add</CACIButton>
          </div>
          {quotations.length === 0 ? (
            <p className="text-[13px] text-n400 text-center py-2">
              No quotations added. Tap "Add" to include a notable quote.
            </p>
          ) : (
            <div className="space-y-3">
              {quotations.map((q, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <CACIInput placeholder='Source — e.g. "C.S. Lewis"' value={q.reference}
                      onChange={(e) => updateQuotation(i, "reference", e.target.value)} containerClassName="mb-0" />
                    <CACITextarea placeholder="Full quotation text…" value={q.text}
                      onChange={(e) => updateQuotation(i, "text", e.target.value)} className="min-h-[64px]" />
                  </div>
                  <button type="button" onClick={() => removeQuotation(i)}
                    className="mt-1 p-1.5 rounded-lg text-n400 hover:text-caci-red hover:bg-caci-red-bg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CACICard>

        {error && (
          <div className="bg-caci-red-bg border border-caci-red/20 rounded-xl p-3 flex items-start gap-2">
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
