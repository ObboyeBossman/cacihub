// ============================================================
// CACI HUB — Phone Number Utilities (Ghana format)
// ============================================================
//
// DISPLAY RULES (what the user sees and types):
//   - Always 10 digits starting with 0  →  "059 352 9509"
//   - If the user starts typing without a leading 0, we prepend one
//   - If the user starts with 0 we keep it — we never add a second 0
//   - Hard cap: 10 digits. Any digit beyond the 10th is silently dropped
//   - Spaces are cosmetic only (positions 3 and 7 in the display string)
//
// NORMALISATION (for API / auth calls):
//   - "059 352 9509" → "233592952509" (store format, no +)
//   - "+233..." / "233..." → kept as-is
//   - Returns null for anything that doesn't resolve to 10 local digits
//
// ============================================================

/**
 * Take whatever the user has typed so far and return the correctly
 * formatted display string ("059 352 9509") plus the raw 10-digit
 * string underneath.
 *
 * Rules:
 *   1. Strip everything that isn't a digit.
 *   2. If the result is empty → return empty.
 *   3. If the first digit is NOT 0 → prepend "0".
 *   4. Cap to 10 digits.
 *   5. Format as "XXX XXX XXXX" (3-3-4).
 */
export function processPhoneInput(raw: string): { display: string; digits: string } {
  // 1. Strip non-digits
  let digits = raw.replace(/\D/g, "");

  // 2. Empty guard
  if (digits.length === 0) return { display: "", digits: "" };

  // 3. Ensure leading 0 — only prepend if the very first digit is not 0
  if (digits[0] !== "0") {
    digits = "0" + digits;
  }

  // 4. Hard cap at 10 digits
  digits = digits.slice(0, 10);

  // 5. Format as 3-3-4 with spaces
  let display = digits;
  if (digits.length > 6) {
    display = digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6);
  } else if (digits.length > 3) {
    display = digits.slice(0, 3) + " " + digits.slice(3);
  }

  return { display, digits };
}

/**
 * Normalise any Ghana format → "233XXXXXXXXX" (12 digits, no +).
 *
 * Accepts:
 *   "0241234567"     (10 digits, leading 0)   → "233241234567"
 *   "241234567"      (9 digits, no leading 0) → "233241234567"
 *   "233241234567"   (already normalised)      → "233241234567"
 *   "+233241234567"                            → "233241234567"
 *   Display strings like "024 123 4567"        → strips spaces first
 *
 * Returns null for anything that cannot be resolved.
 */
export function normalizeGhanaPhone(raw: string): string | null {
  if (!raw) return null;
  let s = raw.replace(/\D/g, ""); // strip spaces, dashes, +, etc.

  if (/^233\d{9}$/.test(s)) return s;           // already 233...
  if (/^0\d{9}$/.test(s)) return "233" + s.slice(1); // 0XX...
  if (/^\d{9}$/.test(s)) return "233" + s;           // 9-digit local

  return null;
}

/** Validate Ghana phone (any format). */
export function isValidGhanaPhone(raw: string): boolean {
  return normalizeGhanaPhone(raw) !== null;
}

/** Display format → "024 123 4567" */
export function formatGhanaPhoneForDisplay(raw: string): string {
  const norm = normalizeGhanaPhone(raw);
  if (!norm) return raw;
  const local = "0" + norm.slice(3); // "0XXXXXXXXX"
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/** For Supabase/Auth calls → "+233XXXXXXXXX" */
export function toSupabaseAuthPhone(raw: string): string | null {
  const norm = normalizeGhanaPhone(raw);
  return norm ? "+" + norm : null;
}

/**
 * @deprecated — kept for any callers that still reference it.
 * The LoginScreen now uses processPhoneInput directly (controlled input).
 * This is a no-op that returns an empty cleanup function.
 */
export function attachPhoneInputFormatter(_el: HTMLInputElement): () => void {
  return () => {};
}
