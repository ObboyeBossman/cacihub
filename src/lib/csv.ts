// ============================================================
// CACI Hub — CSV export utility
// Converts an array of records into a downloadable CSV file.
// ============================================================

/** Escape a value for CSV: wrap in quotes if it contains comma, quote, or newline. */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from an array of records.
 * @param rows  Array of objects to export
 * @param columns  Ordered column definitions: { key, label }
 */
export function toCsv<T>(
  rows: readonly T[],
  columns: readonly { key: keyof T; label: string }[],
): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvValue(row[c.key] as unknown)).join(","))
    .join("\r\n");
  return `${header}\r\n${body}`;
}

/**
 * Trigger a browser download of a CSV file.
 * Safe to call only in the browser (uses Blob + anchor click).
 */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Release the object URL after a short delay to ensure download starts.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
