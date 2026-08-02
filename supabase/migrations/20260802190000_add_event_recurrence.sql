-- ============================================================
-- CACI Hub — Recurring events support
-- Adds recurrence and recurrence_end_date columns to assembly_events.
-- ============================================================

ALTER TABLE assembly_events
  ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMPTZ;
