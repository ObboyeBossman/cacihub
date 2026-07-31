"use client";

import { useState, useRef } from "react";
import {
  Layers, Calendar, BookOpen, Tag, Image as ImageIcon, Info,
  Upload, X, Loader2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonSeriesDTO } from "@/lib/types";
import {
  CACIButton, CACIInput, CACITextarea, CACICard, CACISelect, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";

interface Props {
  /** When provided, we're editing an existing series */
  existing?: SermonSeriesDTO;
}

export function AdminSermonSeriesAdd({ existing }: Props) {
  const { back, navigate, setParam } = useApp();
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [theme, setTheme] = useState(existing?.theme ?? "");
  const [anchorText, setAnchorText] = useState(existing?.anchorText ?? "");
  const [coverImage, setCoverImage] = useState(existing?.coverImage ?? "");
  const [year, setYear] = useState(String(existing?.year ?? new Date().getFullYear()));
  const [status, setStatus] = useState<"ongoing" | "completed">(existing?.status ?? "ongoing");
  const [startDate, setStartDate] = useState(existing?.startDate ? existing.startDate.slice(0, 10) : "");
  const [endDate, setEndDate] = useState(existing?.endDate ? existing.endDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image upload state
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(existing?.coverImage ?? null);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  // Track blob objectUrl separately so we can revoke it and avoid broken images
  const objectUrlRef = useRef<string | null>(null);
  // Preview image load/error states
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke any previous objectUrl to free memory and avoid stale previews
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Show local blob preview immediately while uploading
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
      form.append("folder", "series-covers");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      // Replace blob preview with permanent CDN URL, then revoke the objectUrl
      setCoverImage(data.url);
      setPreviewSrc(data.url);
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      toast.success("Cover image uploaded");
    } catch (err: any) {
      setError(err.message ?? "Image upload failed");
      toast.error(err.message ?? "Image upload failed");
      // Revoke the objectUrl and clear the broken preview
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      setPreviewSrc(null);
      setCoverImage("");
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearImage = () => {
    // Revoke any blob objectUrl before clearing
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCoverImage("");
    setPreviewSrc(null);
    setPreviewLoading(false);
    setPreviewError(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) { setError("Title is required."); return; }
    if (uploading) { setError("Please wait for the image to finish uploading."); return; }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        theme: theme.trim() || undefined,
        anchorText: anchorText.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        year: Number(year) || new Date().getFullYear(),
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      if (isEdit && existing) {
        await api.sermonSeries.update(existing.id, payload);
        toast.success("Series updated");
        setParam("seriesId", existing.id);
        navigate("admin-sermon-series-detail");
      } else {
        const res = await api.sermonSeries.create(payload);
        toast.success("Series created");
        setParam("seriesId", res.series.id);
        navigate("admin-sermon-series-detail");
      }
    } catch (e: any) {
      const msg = e?.message || (isEdit ? "Failed to update series" : "Failed to create series");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const title_text = isEdit ? "Edit Series" : "New Series";
  const subtitle_text = isEdit ? `Editing "${existing?.title}"` : "Create a new sermon series";

  return (
    <>
      <MobileHeader title={title_text} onBack={back} />
      <DesktopTopBar
        title={title_text}
        subtitle={subtitle_text}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" onClick={back}>Cancel</CACIButton>
            <CACIButton size="sm" loading={saving} onClick={handleSave}>
              {isEdit ? "Save Changes" : "Create Series"}
            </CACIButton>
          </div>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
        {/* Core details */}
        <CACICard>
          <SectionHeading title="Series Details" className="mb-4" />
          <div className="space-y-4">
            <CACIInput
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Book of Acts"
              leftIcon={<Layers size={16} />}
              required
            />
            <CACIInput
              label="Theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Boldness in the Holy Spirit"
              leftIcon={<Tag size={16} />}
            />
            <CACIInput
              label="Anchor Scripture"
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              placeholder="e.g. Acts 1:8"
              leftIcon={<BookOpen size={16} />}
            />
            <CACITextarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A summary of what this series covers…"
              className="min-h-[90px]"
            />
          </div>
        </CACICard>

        {/* Status & dates */}
        <CACICard>
          <SectionHeading title="Status & Dates" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CACIInput
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder={String(new Date().getFullYear())}
            />
            <CACISelect
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "ongoing" | "completed")}
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </CACISelect>
            <div />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <CACIInput
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              leftIcon={<Calendar size={16} />}
            />
            <CACIInput
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              leftIcon={<Calendar size={16} />}
            />
          </div>
        </CACICard>

        {/* Cover image */}
        <CACICard>
          <SectionHeading title="Cover Image (optional)" className="mb-4" />

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-n100 rounded-lg mb-4 w-fit">
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                uploadMode === "url"
                  ? "bg-white text-n900 shadow-sm"
                  : "text-n500 hover:text-n700"
              }`}
            >
              Paste URL
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                uploadMode === "file"
                  ? "bg-white text-n900 shadow-sm"
                  : "text-n500 hover:text-n700"
              }`}
            >
              Upload from device
            </button>
          </div>

          {uploadMode === "url" ? (
            <CACIInput
              label="Cover Image URL"
              value={coverImage}
              onChange={(e) => {
                const val = e.target.value.trim();
                setCoverImage(val);
                // Only attempt to preview when it looks like a complete URL
                const looksValid = val.startsWith("http://") || val.startsWith("https://");
                if (looksValid) {
                  setPreviewSrc(val);
                  setPreviewLoading(true);
                  setPreviewError(false);
                } else {
                  setPreviewSrc(null);
                  setPreviewLoading(false);
                  setPreviewError(false);
                }
              }}
              placeholder="https://…/cover.jpg"
              leftIcon={<ImageIcon size={16} />}
            />
          ) : (
            <div>
              <label className="block text-[13px] font-medium text-n700 mb-1.5">
                Cover Image
              </label>

              {/* Drop zone / file picker */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={`
                  w-full border-2 border-dashed rounded-xl p-6
                  flex flex-col items-center justify-center gap-2
                  transition-colors duration-150 cursor-pointer
                  ${uploading
                    ? "border-n200 bg-n50 cursor-not-allowed"
                    : "border-n200 bg-n50 hover:border-caci-red hover:bg-caci-red-bg"
                  }
                `}
              >
                {uploading ? (
                  <>
                    <Loader2 size={24} className="text-caci-red animate-spin" />
                    <span className="text-[13px] text-n500">Uploading…</span>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-n400" />
                    <span className="text-[13px] text-n600 font-medium">
                      Tap to choose an image
                    </span>
                    <span className="text-[12px] text-n400">
                      JPEG, PNG, WebP or GIF · max 5 MB
                    </span>
                  </>
                )}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Preview + clear */}
          {previewSrc && (
            <div className="mt-3 relative w-48 h-32 rounded-lg overflow-hidden border border-n100 group bg-n50">
              {/* Skeleton shimmer shown while image is loading */}
              {previewLoading && !previewError && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-n100 via-n50 to-n100 bg-[length:200%_100%]" />
              )}

              {/* Error fallback — shown when image fails to load */}
              {previewError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-n50">
                  <ImageIcon size={20} className="text-n300" />
                  <span className="text-[11px] text-n400 text-center px-2 leading-tight">
                    Couldn't load preview
                  </span>
                </div>
              )}

              {/* The image itself — fades in smoothly once loaded */}
              {!previewError && (
                <img
                  key={previewSrc}
                  src={previewSrc}
                  alt="Cover image preview"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    previewLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoad={() => {
                    setPreviewLoading(false);
                    setPreviewError(false);
                  }}
                  onError={() => {
                    setPreviewLoading(false);
                    setPreviewError(true);
                  }}
                />
              )}

              {/* Clear button — always accessible on focus, visible on hover */}
              {!previewError && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="
                    absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full
                    p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150
                    focus:opacity-100
                  "
                  aria-label="Remove cover image"
                >
                  <X size={14} />
                </button>
              )}

              {/* Clear button always shown when in error state */}
              {previewError && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="
                    absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-0.5
                  "
                  aria-label="Remove cover image"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {uploading && (
            <p className="text-[12px] text-n400 mt-2">
              Uploading image — do not close this page.
            </p>
          )}
        </CACICard>

        {error && (
          <div className="bg-caci-red-bg border border-caci-red/20 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-caci-red shrink-0 mt-0.5" />
            <p className="text-[14px] text-caci-red">{error}</p>
          </div>
        )}

        {/* Mobile actions */}
        <div className="md:hidden flex gap-3 pt-2">
          <CACIButton variant="secondary" className="flex-1" onClick={back}>Cancel</CACIButton>
          <CACIButton className="flex-1" loading={saving} onClick={handleSave}>
            {isEdit ? "Save Changes" : "Create Series"}
          </CACIButton>
        </div>
      </div>
    </>
  );
}
