"use client";

import { useState, useRef } from "react";
import {
  BookOpen, Calendar, Mic, Image as ImageIcon, Info, Plus, Trash2,
  Clock, Tag, Hash, Music, Video, FileText, Upload, X, Link,
  ChevronLeft, ChevronRight, Check, Play, Pause, Send,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO, SermonQuotation, SermonMediaType } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { normaliseCoverUrl, cn } from "@/lib/utils";
import {
  CACIButton, CACIInput, CACITextarea, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";

interface Props {
  existing?: SermonDTO;
}

interface MediaItem {
  id: string;
  type: SermonMediaType;
  url: string;
  label: string;
  description: string;
  // File-upload UI fields (not sent to API)
  _fileName?: string;
  _fileSize?: string;
  _progress?: number; // 0-100
  _status?: "idle" | "uploading" | "done";
}

const MEDIA_TYPE_META: Record<
  SermonMediaType,
  { label: string; icon: React.ReactNode; placeholder: string; badge: string; badgeBg: string }
> = {
  audio:    { label: "Audio",    icon: <Music     size={14} />, placeholder: "https://…/sermon.mp3",    badge: "MP3",    badgeBg: "bg-caci-blue text-white" },
  video:    { label: "Video",    icon: <Video     size={14} />, placeholder: "https://youtube.com/…",   badge: "VIDEO",  badgeBg: "bg-purple-600 text-white" },
  document: { label: "Document", icon: <FileText  size={14} />, placeholder: "https://…/notes.pdf",    badge: "PDF",    badgeBg: "bg-caci-red text-white" },
  image:    { label: "Image",    icon: <ImageIcon size={14} />, placeholder: "https://…/graphic.jpg",  badge: "IMG",    badgeBg: "bg-emerald-600 text-white" },
  slides:   { label: "Slides",   icon: <FileText  size={14} />, placeholder: "https://…/slides.pptx",  badge: "SLIDES", badgeBg: "bg-orange-500 text-white" },
};

function makeId() { return Math.random().toString(36).slice(2); }

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const STEPS = [
  { id: 1, label: "Details",  desc: "Metadata" },
  { id: 2, label: "Files",    desc: "Media" },
  { id: 3, label: "Artwork",  desc: "Banner" },
  { id: 4, label: "Review",   desc: "Publish" },
];

export function AdminSermonAdd({ existing }: Props) {
  const { back, params } = useApp();
  const isEdit = !!existing;

  // ── Step navigation ──────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1 fields ────────────────────────────────────────
  const [title, setTitle]              = useState(existing?.title ?? "");
  const [speaker, setSpeaker]          = useState(existing?.speaker ?? "");
  const [date, setDate]                = useState(
    existing?.date ? existing.date.slice(0, 10) : new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(existing?.description ?? "");
  const [theme, setTheme]              = useState(existing?.theme ?? "");
  const [scripture, setScripture]      = useState(existing?.scriptureReference ?? "");
  const [sequence, setSequence]        = useState(String(existing?.sequence ?? ""));
  // Duration is auto-detected from audio/video uploads; never manually entered
  const [durationSeconds, setDurationSeconds] = useState<number | null>(
    existing?.durationSeconds ?? null
  );
  const [errors, setErrors]            = useState<Record<string, string>>({});

  // ── Step 2: Media ─────────────────────────────────────────
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    existing?.media?.map((m) => ({
      id: makeId(),
      type: m.type as SermonMediaType,
      url: m.url,
      label: m.label ?? "",
      description: m.description ?? "",
      _fileName: m.url.split("/").pop() ?? "",
      _status: "done" as const,
      _progress: 100,
    })) ?? []
  );
  // Track which items were added manually (URL mode) vs file upload
  const [urlModeIds, setUrlModeIds] = useState<Set<string>>(new Set());
  const mediaFileRef = useRef<HTMLInputElement>(null);

  // ── Step 3: Cover + quotes ────────────────────────────────
  const initialPreview = normaliseCoverUrl(existing?.coverImageUrl ?? null);
  const [coverUrl, setCoverUrl]             = useState(existing?.coverImageUrl ?? "");
  const [previewSrc, setPreviewSrc]         = useState<string | null>(initialPreview);
  const [previewLoading, setPreviewLoading] = useState(!!initialPreview);
  const [previewError, setPreviewError]     = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [coverMode, setCoverMode]           = useState<"url" | "file">("url");
  const coverFileRef                        = useRef<HTMLInputElement>(null);
  const objectUrlRef                        = useRef<string | null>(null);
  const [quotations, setQuotations]         = useState<SermonQuotation[]>(existing?.quotations ?? []);

  // ── Step 4: Saving ────────────────────────────────────────
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef                  = useRef<HTMLAudioElement>(null);

  // ── Step 2: per-item URL errors ───────────────────────────
  const [mediaItemErrors, setMediaItemErrors] = useState<Record<string, string>>({});

  const seriesId = existing?.seriesId ?? params.seriesId ?? null;

  // ── Validation ────────────────────────────────────────────
  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim())   errs.title   = "Sermon title is required";
    if (!speaker.trim()) errs.speaker = "Preacher name is required";
    if (!date)           errs.date    = "Date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const itemErrs: Record<string, string> = {};
    mediaItems.forEach((m) => {
      if (m._status === "uploading") {
        itemErrs[m.id] = "Still uploading — please wait";
      } else if (!m.url.trim()) {
        itemErrs[m.id] = "Add a URL or remove this item";
      }
    });
    setMediaItemErrors(itemErrs);
    return Object.keys(itemErrs).length === 0;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 4) setStep((s) => s + 1);
  }
  function goPrev() {
    if (step === 3) setMediaItemErrors({});
    if (step > 1) setStep((s) => s - 1);
  }

  // ── Media helpers ─────────────────────────────────────────
  function addMediaManual() {
    const id = makeId();
    setUrlModeIds((prev) => new Set([...prev, id]));
    setMediaItems((prev) => [
      ...prev,
      { id, type: "audio", url: "", label: "", description: "", _status: "idle", _progress: 0 },
    ]);
  }

  function updateMedia(id: string, field: keyof Pick<MediaItem, "type" | "url" | "label" | "description">, value: string) {
    setMediaItems((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
    // Clear inline error as soon as user starts typing a URL
    if (field === "url" && value.trim()) {
      setMediaItemErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  }
  function removeMedia(id: string) {
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    setUrlModeIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setMediaItemErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  // ── Auto-detect duration from audio/video file ───────────
  function detectDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      if (!file.type.startsWith("audio") && !file.type.startsWith("video")) {
        resolve(null);
        return;
      }
      const el  = file.type.startsWith("audio")
        ? document.createElement("audio")
        : document.createElement("video");
      const url = URL.createObjectURL(file);
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        const secs = isFinite(el.duration) && el.duration > 0
          ? Math.round(el.duration)
          : null;
        resolve(secs);
      };
      el.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      el.src = url;
    });
  }

  // Animated progress ticker shown while real upload is in flight
  function startProgressTicker(id: string): () => void {
    let progress = 0;
    const tick = setInterval(() => {
      // Creep to 90% — final 100% is set when the upload API resolves
      progress = Math.min(progress + Math.floor(Math.random() * 10 + 5), 90);
      setMediaItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, _progress: progress } : m))
      );
    }, 350);
    return () => clearInterval(tick);
  }

  async function uploadOneFile(file: File, id: string): Promise<void> {
    const stopTicker = startProgressTicker(id);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "sermon-media");

      const res = await fetch("/api/upload-media", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      // Flip to 100% done with the real R2 URL
      setMediaItems((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                url: data.url,
                type: (data.type as SermonMediaType) ?? m.type,
                _progress: 100,
                _status: "done",
              }
            : m
        )
      );
      // Clear any "still uploading" inline error now that it's done
      setMediaItemErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
      toast.success(`${file.name} uploaded`);
    } catch (err: any) {
      setMediaItems((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, _progress: 0, _status: "idle", url: "" }
            : m
        )
      );
      toast.error(err.message ?? "File upload failed");
    } finally {
      stopTicker();
    }
  }

  function handleLocalFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      const isAudio  = file.type.startsWith("audio");
      const isVideo  = file.type.startsWith("video");
      const isImage  = file.type.startsWith("image");
      const isSlides = [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.apple.keynote",
      ].includes(file.type);
      const type: SermonMediaType = isAudio ? "audio" : isVideo ? "video" : isImage ? "image" : isSlides ? "slides" : "document";
      const id = makeId();
      // Add the item immediately as uploading — url is "" until upload resolves
      setMediaItems((prev) => [
        ...prev,
        {
          id,
          type,
          url: "",
          label: file.name.replace(/\.[^/.]+$/, ""),
          description: "",
          _fileName: file.name,
          _fileSize: formatBytes(file.size),
          _progress: 0,
          _status: "uploading",
        },
      ]);
      // Fire real upload in background
      uploadOneFile(file, id);
      // Auto-detect duration for audio/video; first file to resolve wins
      if (file.type.startsWith("audio") || file.type.startsWith("video")) {
        detectDuration(file).then((secs) => {
          if (secs !== null) setDurationSeconds((prev) => prev ?? secs);
        });
      }
    });
    if (mediaFileRef.current) mediaFileRef.current.value = "";
  }

  // ── Cover image upload ────────────────────────────────────
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
    setFormError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "sermon-covers");
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setCoverUrl(data.url);
      setPreviewSrc(data.url);
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      toast.success("Cover image uploaded");
    } catch (err: any) {
      setFormError(err.message ?? "Image upload failed");
      toast.error(err.message ?? "Image upload failed");
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      setPreviewSrc(null);
      setCoverUrl("");
    } finally {
      setUploading(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  };

  function clearCover() {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    setCoverUrl(""); setPreviewSrc(null); setPreviewLoading(false); setPreviewError(false);
    if (coverFileRef.current) coverFileRef.current.value = "";
  }

  // ── Quotations ────────────────────────────────────────────
  function addQuotation() { setQuotations((q) => [...q, { reference: "", text: "" }]); }
  function updateQuotation(i: number, field: keyof SermonQuotation, value: string) {
    setQuotations((q) => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function removeQuotation(i: number) { setQuotations((q) => q.filter((_, idx) => idx !== i)); }

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError(null);
    if (!validateStep1()) { setStep(1); return; }
    if (uploading) { setFormError("Please wait for the image to finish uploading."); return; }

    const invalidMedia = mediaItems.find((m) => !m.url.trim());
    if (invalidMedia) { setFormError("Every media item needs a URL."); return; }

    setSaving(true);
    try {
      const cleanQuotations = quotations.filter((q) => q.reference.trim() || q.text.trim());
      // durationSeconds is set automatically from audio/video detection
      const seqNum = sequence.trim() ? parseInt(sequence, 10) : undefined;

      const payload = {
        title:              title.trim(),
        speaker:            speaker.trim(),
        date,
        description:        description.trim() || undefined,
        theme:              theme.trim() || undefined,
        scriptureReference: scripture.trim() || undefined,
        coverImageUrl:      coverUrl.trim() || undefined,
        quotations:         cleanQuotations,
        media:              mediaItems.map((m, i) => ({
          type:        m.type,
          url:         m.url.trim(),
          label:       m.label.trim() || null,
          description: m.description.trim() || null,
          sequence:    i,
        })),
        durationSeconds:    durationSeconds ?? undefined,
        sequence:           seqNum,
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
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const pageTitle   = isEdit ? "Edit Sermon" : "Add Sermon";
  const primaryAudio = mediaItems.find((m) => m.type === "audio");

  function toggleAudio() {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  }

  return (
    <>
      <MobileHeader title={pageTitle} onBack={back} />
      <DesktopTopBar
        title={pageTitle}
        subtitle={isEdit ? `Editing "${existing!.title}"` : "Record a new message or teaching"}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" onClick={back}>Cancel</CACIButton>
            {step === 4 && (
              <CACIButton size="sm" loading={saving} leftIcon={<Send size={14} />} onClick={handleSave}>
                {isEdit ? "Save Changes" : "Publish Sermon"}
              </CACIButton>
            )}
          </div>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 pb-10">

        {/* ── Stepper ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-n100 p-4 shadow-sm">
          {/* Mobile label */}
          <div className="sm:hidden flex items-center justify-between pb-3 mb-3 border-b border-n50 text-[12px] font-bold">
            <span className="text-caci-blue">Step {step} of {STEPS.length}</span>
            <span className="text-n900">{STEPS[step - 1].label}</span>
          </div>

          <div className="relative max-w-sm mx-auto">
            {/* Track */}
            <div className="absolute top-4 left-5 right-5 h-1 bg-n100 rounded-full z-0">
              <div
                className="h-full bg-caci-blue rounded-full transition-all duration-300"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            <div className="flex items-start justify-between relative z-10">
              {STEPS.map((s) => {
                const done    = step > s.id;
                const current = step === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (s.id <= step) setStep(s.id);
                      else if (validateStep1()) setStep(s.id);
                    }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center font-bold text-[12px] transition-all duration-200 shadow-sm",
                      done    ? "bg-caci-blue text-white ring-4 ring-caci-blue-bg"
                      : current ? "bg-caci-red  text-white ring-4 ring-caci-red-bg"
                      :           "bg-white border-2 border-n100 text-n400"
                    )}>
                      {done ? <Check size={13} /> : s.id}
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold hidden sm:block",
                      current ? "text-caci-red" : done ? "text-caci-blue" : "text-n300"
                    )}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Step Content ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-n100 p-4 sm:p-6 shadow-sm min-h-[300px]">

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-n50">
                <h3 className="text-[13px] font-extrabold text-n900 uppercase tracking-wide">
                  Step 1 — Sermon Information
                </h3>
              </div>

              <CACIInput
                label="Sermon Title"
                required
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: "" })); }}
                placeholder="e.g. The Power of the Cross"
                leftIcon={<BookOpen size={16} />}
                error={errors.title || null}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CACIInput
                  label="Preacher"
                  required
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  placeholder="e.g. Pastor Emmanuel Mensah"
                  leftIcon={<Mic size={16} />}
                  error={errors.speaker || null}
                />
                <CACIInput
                  label="Preached Date"
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  leftIcon={<Calendar size={16} />}
                  error={errors.date || null}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CACIInput
                  label="Theme (optional)"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Faith and Perseverance"
                  leftIcon={<Tag size={16} />}
                />
                <CACIInput
                  label="Scripture Reference (optional)"
                  value={scripture}
                  onChange={(e) => setScripture(e.target.value)}
                  placeholder="e.g. 1 Corinthians 1:18"
                />
              </div>

              <CACIInput
                label="Sequence in series (optional)"
                type="number"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                placeholder="e.g. 3"
                leftIcon={<Hash size={16} />}
              />

              <CACITextarea
                label="Sermon Summary (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief summary of the message…"
                className="min-h-[90px]"
              />
            </div>
          )}

          {/* STEP 2 — Files */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-n50">
                <h3 className="text-[13px] font-extrabold text-n900 uppercase tracking-wide">
                  Step 2 — Upload Files
                </h3>
                <p className="text-[12px] text-n400 mt-0.5">
                  Audio, video, PDF notes or any related files.
                </p>
              </div>

              <input
                ref={mediaFileRef}
                type="file"
                multiple
                accept="*"
                onChange={handleLocalFileSelect}
                className="hidden"
              />

              {/* Step-level error summary — only shown after a failed Continue attempt */}
              {Object.keys(mediaItemErrors).length > 0 && (
                <div className="bg-caci-red-bg border border-caci-red/20 rounded-xl p-3 flex items-start gap-2">
                  <Info size={15} className="text-caci-red shrink-0 mt-0.5" />
                  <p className="text-[13px] text-caci-red">
                    {Object.keys(mediaItemErrors).length === 1
                      ? "One media item needs attention — add its URL or remove it to continue."
                      : `${Object.keys(mediaItemErrors).length} media items need attention — add URLs or remove them to continue.`}
                  </p>
                </div>
              )}

              {/* Drop zone */}
              <button
                type="button"
                onClick={() => mediaFileRef.current?.click()}
                className="w-full border-2 border-dashed border-n200 hover:border-caci-blue hover:bg-caci-blue-bg/30 bg-n50 rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 group"
              >
                <Upload size={22} className="text-n300 group-hover:text-caci-blue mx-auto mb-2 transition-colors" />
                <p className="text-[13px] font-bold text-n700 group-hover:text-caci-blue transition-colors">
                  Tap to choose files from device
                </p>
                <p className="text-[11px] text-n400 mt-0.5">Audio · Video · Images · PDF · Slides · Documents</p>
              </button>

              {/* QClay pill cards — file-upload items */}
              {mediaItems.filter((m) => !urlModeIds.has(m.id)).length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[12px] font-bold text-n700">
                    Uploaded files ({mediaItems.filter((m) => !urlModeIds.has(m.id)).length})
                  </p>
                  {mediaItems
                    .filter((m) => !urlModeIds.has(m.id))
                    .map((item) => (
                      <QClayPill
                        key={item.id}
                        item={item}
                        onRemove={removeMedia}
                        onChangeLabel={(v) => updateMedia(item.id, "label", v)}
                        onChangeDescription={(v) => updateMedia(item.id, "description", v)}
                        error={mediaItemErrors[item.id]}
                      />
                    ))}
                  {/* Auto-detected duration badge */}
                  {durationSeconds !== null && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 w-fit">
                      <Clock size={11} className="shrink-0" />
                      <span className="font-semibold">Duration detected:</span>
                      <span className="font-mono">{formatDuration(durationSeconds)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Manual URL add */}
              <div className="pt-1">
                <p className="text-[11px] text-n400 font-medium mb-2">Or link a URL directly:</p>
                <button
                  type="button"
                  onClick={addMediaManual}
                  className="w-full border border-dashed border-n200 hover:border-caci-blue rounded-xl py-3 flex items-center justify-center gap-2 text-[12px] text-n400 hover:text-caci-blue hover:bg-caci-blue-bg/30 transition-all"
                >
                  <Link size={13} />
                  Add media URL
                </button>
              </div>

              {/* URL-mode items */}
              {mediaItems
                .filter((m) => urlModeIds.has(m.id))
                .map((item, idx) => {
                  const meta    = MEDIA_TYPE_META[item.type];
                  const itemErr = mediaItemErrors[item.id];
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex gap-2 items-start p-3 rounded-xl border transition-all duration-200",
                        itemErr
                          ? "bg-caci-red-bg border-caci-red/30"
                          : "bg-n50 border-n100"
                      )}
                    >
                      <div className="flex-1 space-y-2 min-w-0">
                        {/* Type selector */}
                        <div className="flex gap-1.5 flex-wrap">
                          {(Object.keys(MEDIA_TYPE_META) as SermonMediaType[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => updateMedia(item.id, "type", t)}
                              className={cn(
                                "flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-medium transition-all",
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
                        <CACIInput
                          value={item.url}
                          onChange={(e) => updateMedia(item.id, "url", e.target.value)}
                          placeholder={meta.placeholder}
                          leftIcon={<Link size={14} />}
                          containerClassName="mb-0"
                        />
                        {itemErr && (
                          <p className="text-[11px] text-caci-red font-medium flex items-center gap-1">
                            <Info size={11} className="shrink-0" />
                            {itemErr}
                          </p>
                        )}
                        <CACIInput
                          value={item.label}
                          onChange={(e) => updateMedia(item.id, "label", e.target.value)}
                          placeholder={`Label — e.g. "Part ${idx + 1}"`}
                          containerClassName="mb-0"
                        />
                        <CACIInput
                          value={item.description}
                          onChange={(e) => updateMedia(item.id, "description", e.target.value)}
                          placeholder="Description (optional) — e.g. Speaker notes, timestamps…"
                          containerClassName="mb-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(item.id)}
                        className="mt-1 p-1.5 rounded-lg text-n400 hover:text-caci-red hover:bg-caci-red-bg transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          {/* STEP 3 — Artwork & Quotes */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-n50">
                <h3 className="text-[13px] font-extrabold text-n900 uppercase tracking-wide">
                  Step 3 — Cover Banner & Quotes
                </h3>
              </div>

              {/* Cover mode toggle */}
              <div className="flex gap-1 p-1 bg-n100 rounded-xl w-fit">
                {(["url", "file"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCoverMode(mode)}
                    className={cn(
                      "flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all",
                      coverMode === mode
                        ? "bg-white text-n900 shadow-sm"
                        : "text-n500 hover:text-n700"
                    )}
                  >
                    {mode === "url" ? <Link size={11} /> : <Upload size={11} />}
                    {mode === "url" ? "Paste URL" : "Upload image"}
                  </button>
                ))}
              </div>

              {coverMode === "url" ? (
                <CACIInput
                  label="Cover Image URL"
                  value={coverUrl}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setCoverUrl(val);
                    const ok = val.startsWith("http://") || val.startsWith("https://");
                    setPreviewSrc(ok ? val : null);
                    setPreviewLoading(ok);
                    setPreviewError(false);
                  }}
                  placeholder="https://…/cover.jpg"
                  leftIcon={<ImageIcon size={16} />}
                />
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => coverFileRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                      "w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition-all",
                      uploading
                        ? "border-caci-blue/40 bg-caci-blue-bg/30 cursor-wait"
                        : "border-n200 hover:border-caci-blue hover:bg-caci-blue-bg/20 cursor-pointer"
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
                        <p className="text-[11px] text-n400">JPEG · PNG · WebP · max 5 MB</p>
                      </>
                    )}
                  </button>
                  <input
                    ref={coverFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* Cover preview */}
              {previewSrc && (
                <div className="relative max-w-xs rounded-xl overflow-hidden aspect-video bg-n100 border border-n100 group">
                  {previewLoading && !previewError && (
                    <div className="absolute inset-0 animate-pulse bg-n100" />
                  )}
                  {!previewError && (
                    <img
                      key={previewSrc}
                      src={previewSrc}
                      alt="Cover preview"
                      className={cn(
                        "w-full h-full object-cover transition-opacity duration-200",
                        previewLoading ? "opacity-0" : "opacity-100"
                      )}
                      onLoad={() => { setPreviewLoading(false); setPreviewError(false); }}
                      onError={() => { setPreviewLoading(false); setPreviewError(true); }}
                    />
                  )}
                  {previewError && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-1 text-n400">
                      <ImageIcon size={20} />
                      <p className="text-[11px]">Couldn&apos;t load preview</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={clearCover}
                    className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remove cover image"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Quotations */}
              <div className="pt-2 border-t border-n50">
                <div className="flex items-center justify-between mb-3">
                  <SectionHeading title="Quotations (optional)" />
                  <CACIButton variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={addQuotation}>
                    Add
                  </CACIButton>
                </div>
                {quotations.length === 0 ? (
                  <p className="text-[12px] text-n400 text-center py-3">No quotations added.</p>
                ) : (
                  <div className="space-y-3">
                    {quotations.map((q, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <CACIInput
                            placeholder='Source — e.g. "C.S. Lewis"'
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
                          className="mt-1 p-1.5 rounded-lg text-n400 hover:text-caci-red hover:bg-caci-red-bg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-n50 text-center">
                <h3 className="text-[13px] font-extrabold text-n900 uppercase tracking-wide">
                  Step 4 — Review &amp; Publish
                </h3>
                <p className="text-[11px] text-n400 mt-0.5">Check everything looks right before publishing.</p>
              </div>

              {/* Live preview card */}
              <div className="bg-gradient-to-br from-[#002A5E] to-caci-blue rounded-2xl p-4 max-w-sm mx-auto shadow-lg">
                <div className="bg-white rounded-xl p-3 space-y-3">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-n100">
                    {previewSrc && !previewError ? (
                      <img src={previewSrc} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-caci-blue-bg">
                        <ImageIcon size={28} className="text-caci-blue/40" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-caci-blue">{speaker || "— Preacher —"}</p>
                    <h4 className="text-[14px] font-extrabold text-n900 leading-snug mt-0.5">
                      {title || "Untitled Sermon"}
                    </h4>
                    {scripture && (
                      <p className="text-[11px] text-n400 italic mt-0.5">📖 {scripture}</p>
                    )}
                  </div>
                  {primaryAudio?.url && (
                    <div className="bg-caci-blue-bg rounded-lg p-2.5 flex items-center gap-2 border border-caci-blue/10">
                      <audio ref={audioRef} src={primaryAudio.url} onEnded={() => setIsPlaying(false)} />
                      <button
                        type="button"
                        onClick={toggleAudio}
                        className="size-8 rounded-full bg-caci-blue text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity shadow-sm"
                      >
                        {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-caci-blue truncate">
                          {primaryAudio._fileName || primaryAudio.label || "Audio File"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary checklist */}
              <div className="space-y-1.5 max-w-sm mx-auto">
                {[
                  { label: "Title",    value: title,    ok: !!title.trim() },
                  { label: "Preacher", value: speaker,  ok: !!speaker.trim() },
                  { label: "Date",     value: date,     ok: !!date },
                  { label: "Media",    value: `${mediaItems.length} file${mediaItems.length !== 1 ? "s" : ""}`, ok: mediaItems.length > 0 },
                  { label: "Cover",    value: coverUrl ? "Set" : "None (optional)", ok: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-[12px] py-1 border-b border-n50 last:border-0"
                  >
                    <span className="text-n500 font-medium">{row.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-n900 font-semibold truncate max-w-[160px]">{row.value}</span>
                      <CheckCircle2 size={13} className={row.ok ? "text-emerald-500" : "text-n200"} />
                    </div>
                  </div>
                ))}
              </div>

              {formError && (
                <div className="bg-caci-red-bg border border-caci-red/20 rounded-xl p-3 flex items-start gap-2 max-w-sm mx-auto">
                  <Info size={15} className="text-caci-red shrink-0 mt-0.5" />
                  <p className="text-[13px] text-caci-red">{formError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Step Navigation ───────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <CACIButton
            variant="secondary"
            onClick={goPrev}
            disabled={step === 1}
            leftIcon={<ChevronLeft size={16} />}
            size="sm"
            className="min-w-[90px]"
          >
            Back
          </CACIButton>

          {step === 4 ? (
            <CACIButton
              onClick={handleSave}
              loading={saving}
              leftIcon={<Send size={15} />}
              className="min-w-[140px]"
            >
              {isEdit ? "Save Changes" : "Publish Now"}
            </CACIButton>
          ) : (
            <CACIButton
              onClick={goNext}
              rightIcon={<ChevronRight size={16} />}
              className="min-w-[120px]"
            >
              Continue
            </CACIButton>
          )}
        </div>
      </div>
    </>
  );
}

// ── QClay Upload Pill ───────────────────────────────────────

function QClayPill({
  item,
  onRemove,
  onChangeLabel,
  onChangeDescription,
  error,
}: {
  item: MediaItem;
  onRemove: (id: string) => void;
  onChangeLabel: (v: string) => void;
  onChangeDescription: (v: string) => void;
  error?: string;
}) {
  const isDone      = item._status === "done" || item._progress === 100;
  const isUploading = item._status === "uploading";
  const progress    = item._progress ?? 0;
  const meta        = MEDIA_TYPE_META[item.type];

  return (
    <div className={cn(
      "rounded-2xl border shadow-sm p-4 space-y-3 transition-all duration-200",
      error ? "bg-caci-red-bg border-caci-red/30" : "bg-white border-n100"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest shrink-0", meta.badgeBg)}>
            {meta.badge}
          </span>
          <p className="font-bold text-[13px] text-n900 truncate">
            {item._fileName || item.label || "File"}
          </p>
        </div>
        <div className="shrink-0">
          {isUploading && (
            <span className="text-[12px] font-mono font-bold text-n400">{progress}%</span>
          )}
          {isDone && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-200">
              <CheckCircle2 size={12} />
              Done
            </span>
          )}
        </div>
      </div>

      {/* Progress bar — red while uploading, green when done */}
      <div className="w-full h-1.5 bg-n100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-200",
            isDone ? "bg-emerald-500" : "bg-caci-red"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-[11px] text-caci-red font-medium flex items-center gap-1">
          <Info size={11} className="shrink-0" />
          {error}
        </p>
      )}

      {/* Footer — Remove is always available; label input only when upload is done */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-mono text-n400">{item._fileSize ?? ""}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {isDone && (
            <>
              <input
                type="text"
                value={item.label}
                onChange={(e) => onChangeLabel(e.target.value)}
                placeholder="Label (optional)"
                className="text-[11px] px-2 py-1 rounded-lg bg-n50 border border-n100 text-n700 focus:outline-none focus:ring-1 focus:ring-caci-blue w-28"
              />
              <input
                type="text"
                value={item.description}
                onChange={(e) => onChangeDescription(e.target.value)}
                placeholder="Description (optional)"
                className="text-[11px] px-2 py-1 rounded-lg bg-n50 border border-n100 text-n700 focus:outline-none focus:ring-1 focus:ring-caci-blue w-36"
              />
            </>
          )}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="px-2 py-1 rounded-lg bg-caci-red-bg hover:bg-[#ffd6dc] text-caci-red text-[11px] font-bold transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
