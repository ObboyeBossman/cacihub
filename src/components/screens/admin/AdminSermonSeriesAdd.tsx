"use client";

import { useState } from "react";
import {
  Layers, Calendar, BookOpen, Tag, Image as ImageIcon, Info,
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

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) { setError("Title is required."); return; }
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
          <CACIInput
            label="Cover Image URL"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://…/cover.jpg"
            leftIcon={<ImageIcon size={16} />}
          />
          {coverImage && (
            <div className="mt-3 rounded-md overflow-hidden border border-n100 h-32 w-48">
              <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
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
