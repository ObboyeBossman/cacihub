// ============================================================
// Sermon Public Site — Shared types & helpers
// Used by /sermons route and its components
// ============================================================

export interface Quotation {
  reference: string;
  text: string;
}

export interface SermonSummary {
  id: string;
  title: string;
  theme: string;
  scripture: string;
  sequence: number;
  datePreached: string;
  preacher: string;
  speakerRole: string | null;
  duration: number | null;
  summary: string | null;
}

export interface SermonMedia {
  id: string;
  sermonId: string;
  type: "video" | "audio" | "pdf" | "text";
  url: string;
  label: string | null;
  sequence: number;
}

export interface Sermon extends SermonSummary {
  description: string;
  keyTakeaways: string[];
  quotations: string; // JSON string of Quotation[]
  media: SermonMedia[];
  createdAt: string;
  updatedAt: string;
}

export function parseQuotations(raw: string): Quotation[] {
  try {
    return JSON.parse(raw) as Quotation[];
  } catch {
    return [];
  }
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) {
    return `${h}h ${m % 60}m`;
  }
  return `${m}m`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
