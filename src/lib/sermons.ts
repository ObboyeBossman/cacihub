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
  duration: number | null;
}

export interface Sermon extends SermonSummary {
  seriesId: string;
  description: string;
  quotations: string; // JSON string of Quotation[]
  audioUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SermonSeries {
  id: string;
  title: string;
  description: string;
  theme: string;
  anchorText: string | null;
  coverImage: string | null;
  year: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  sermons: SermonSummary[];
  sermonCount: number;
  latestSermon: SermonSummary | null;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  leader: string | null;
  icon: string | null;
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
