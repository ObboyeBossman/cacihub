// ============================================================
// CACI Hub - Display formatting helpers
// ============================================================

import { formatGhanaPhoneForDisplay } from "@/lib/phone";

/** Format ISO date → "Mar 12, 2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Format ISO date → "12 Mar 2026, 14:30" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** Relative time → "just now", "5m ago", "2h ago", "3d ago", "1 Mar" */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Phone display format */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "-";
  return formatGhanaPhoneForDisplay(raw);
}

/**
 * Normalise free-text name/place input to Title Case.
 * Handles ALL-CAPS, all-lowercase, and mixed input.
 * Preserves common particles (of, the, van, de, etc.) in lowercase
 * and always capitalises the very first word.
 *
 * Examples:
 *   "KWAME MENSAH"        → "Kwame Mensah"
 *   "kwame mensah"        → "Kwame Mensah"
 *   "john van der berg"   → "John van der Berg"
 *   "ASSAKAE, TAKORADI"   → "Assakae, Takoradi"
 */
const LOWERCASE_PARTICLES = new Set([
  "of", "the", "and", "at", "in", "on", "for", "to", "a", "an",
  "van", "de", "der", "den", "von", "bin", "binti", "el", "al",
]);

export function toTitleCase(value: string | null | undefined): string {
  if (!value) return value as string;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  return trimmed
    .split(/(\s+)/)
    .map((chunk, index) => {
      // Preserve whitespace chunks as-is
      if (/^\s+$/.test(chunk)) return chunk;
      const lower = chunk.toLowerCase();
      // Always capitalise first word; lowercase particles elsewhere
      if (index === 0 || !LOWERCASE_PARTICLES.has(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join("");
}

/** Title-case a field name for audit display: 'full_name' → 'Full Name' */
export function humanizeField(field: string): string {
  const map: Record<string, string> = {
    full_name: "Full Name",
    phone_number: "Phone Number",
    whatsapp_number: "WhatsApp Number",
    date_of_birth: "Date of Birth",
    marital_status: "Marital Status",
    membership_status: "Membership Status",
    is_active: "Active Status",
    assembly_role: "Assembly Role",
    join_date: "Join Date",
    emergency_contact_name: "Emergency Contact Name",
    emergency_contact_phone: "Emergency Contact Phone",
    emergency_contact_relationship: "Emergency Contact Relationship",
    occupation: "Occupation",
    location: "Location",
    title: "Title",
    gender: "Gender",
    MEMBER_DELETED: "Member Removed",
    MEMBER_CREATED: "Member Added",
  };
  return map[field] || field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format duration in seconds → "32:15" or "1:04:30" */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Parse "mm:ss" or "h:mm:ss" duration string → seconds */
export function parseDurationToSeconds(value: string): number | null {
  if (!value.trim()) return null;
  const parts = value.trim().split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

/** Grouped relative time for chat headers */
export function chatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
