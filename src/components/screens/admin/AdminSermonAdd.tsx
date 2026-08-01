"use client";

import { useState, useRef } from "react";
import {
  BookOpen, Calendar, Mic, Music, Video, Image as ImageIcon,
  Info, Plus, Trash2, Clock, Tag, Hash, Upload, X, Link,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO, SermonQuotation } from "@/lib/types";
import { formatDuration, parseDurationToSeconds } from "@/lib/format";
import { normaliseCoverUrl } from "@/lib/utils";
import {
  CACIButton, CACIInput, CACITextarea, CACICard, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  // Cover image upload state
  const initialPreview = normaliseCoverUrl(existing?.coverImageUrl ?? null);
  const [coverUploadMode, setCoverUploadMode] = useState<"url" | "file">("url");
  const [previewSrc, setPreviewSrc] = useState<string | null>(initialPreview);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

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
      const res = await fetch("/api/upload", { method: "POST", body: form });
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

  const clearCoverImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCoverImageUrl("");
    setPreviewSrc(null);
    setPreviewLoading(false);
    setPreviewError(false);
    if (fileRef.current) fileRef.current.value = "";
  };

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
    if (uploading) { setError("Please wait for the image to finish uploading."); return; }

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
                      placeholder='Reference (e.g. "Faith is..." - C.S. Lewis)'
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

            {/* Cover Image — URL or file upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-n700">Cover Image (optional)</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCoverUploadMode("url")}
                    className={cn(
                      "text-[12px] px-2 py-0.5 rounded-md transition-colors",
                      coverUploadMode === "url"
                        ? "bg-caci-blue text-white"
                        : "text-n500 hover:text-n700"
                    )}
                  >
                    <Link size={11} className="inline mr-1" />URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverUploadMode("file")}
                    className={cn(
                      "text-[12px] px-2 py-0.5 rounded-md transition-colors",
                      coverUploadMode === "file"
                        ? "bg-caci-blue text-white"
                        : "text-n500 hover:text-n700"
                    )}
                  >
                    <Upload size={11} className="inline mr-1" />Upload
                  </button>
                </div>
              </div>

              {coverUploadMode === "url" ? (
                <CACIInput
                  value={coverImageUrl}
                  onChange={(e) => {
                    setCoverImageUrl(e.target.value);
                    setPreviewSrc(e.target.value || null);
                    setPreviewError(false);
                  }}
                  placeholder="https://….jpg"
                  leftIcon={<ImageIcon size={16} />}
                />
              ) : (
                <div>
                  {/* Preview */}
                  {previewSrc && !previewError ? (
                    <div className="relative mb-2 rounded-lg overflow-hidden bg-n100 aspect-video">
                      {previewLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-n100">
                          <div className="size-6 border-2 border-caci-blue border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <img
                        src={previewSrc}
                        alt="Cover preview"
                        className={cn("w-full h-full object-cover transition-opacity", previewLoading ? "opacity-0" : "opacity-100")}
                        onLoad={() => setPreviewLoading(false)}
                        onError={() => { setPreviewError(true); setPreviewLoading(false); }}
                      />
                      <button
                        type="button"
                        onClick={clearCoverImage}
                        className="absolute top-2 right-2 size-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : null}

                  {/* Drop zone */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                      "w-full border-2 border-dashed rounded-lg px-4 py-5 flex flex-col items-center gap-2 transition-colors",
                      uploading
                        ? "border-caci-blue/40 bg-caci-blue/5 cursor-wait"
                        : "border-n200 hover:border-caci-blue hover:bg-caci-blue/5 cursor-pointer"
                    )}
                  >
                    {uploading ? (
                      <>
                        <div className="size-6 border-2 border-caci-blue border-t-transparent rounded-full animate-spin" />
                        <p className="text-[13px] text-caci-blue font-medium">Uploading…</p>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-n400" />
                        <p className="text-[13px] text-n500">
                          {previewSrc && !previewError ? "Replace image" : "Tap to choose an image"}
                        </p>
                        <p className="text-[11px] text-n400">JPEG, PNG, WebP · max 5 MB</p>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
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
