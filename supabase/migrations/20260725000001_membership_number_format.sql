-- =============================================================================
-- CACI HUB — Migration: Update membership number format
-- Old: CACI-00032
-- New: CACI-ASSAK-2026-00032
-- =============================================================================

-- ── 1. Update the trigger function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.assign_membership_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_number integer;
BEGIN
  UPDATE public.member_counter
  SET    last_number = last_number + 1
  WHERE  id = 1
  RETURNING last_number INTO v_next_number;

  NEW.membership_number := 'CACI-ASSAK-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_next_number::text, 5, '0');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.assign_membership_number IS
  'Generates a sequential membership number on INSERT. '
  'Format: CACI-ASSAK-YYYY-00001. Counter never resets.';

-- ── 2. Migrate existing members ──────────────────────────────────────────────
-- Convert old formats to new format.
-- Handles:
--   CACI-00032          → CACI-ASSAK-2026-00032   (original DB trigger format)
--   CACI/ASS/2026/032   → CACI-ASSAK-2026-00032   (app-generated format)

UPDATE public.members
SET membership_number =
  CASE
    -- Old DB trigger format: CACI-NNNNN (no year, no assembly code)
    WHEN membership_number ~ '^CACI-\d{5}$'
    THEN 'CACI-ASSAK-2026-' || LPAD(SPLIT_PART(membership_number, '-', 2), 5, '0')

    -- App-generated format: CACI/ASS/2026/NNN
    WHEN membership_number ~ '^CACI/ASS/\d{4}/\d+'
    THEN 'CACI-ASSAK-' || SPLIT_PART(membership_number, '/', 3) || '-' || LPAD(SPLIT_PART(membership_number, '/', 4), 5, '0')

    -- Already in new format or unknown — leave untouched
    ELSE membership_number
  END
WHERE membership_number IS NOT NULL
  AND membership_number != ''
  AND membership_number NOT LIKE 'CACI-ASSAK-%';

-- ── 3. Update column comment ─────────────────────────────────────────────────

COMMENT ON COLUMN public.members.membership_number IS
  'Format: CACI-ASSAK-YYYY-00001. NULL at insert; set by assign_membership_number trigger.';
