-- ============================================================
-- CACI Hub — Assembly Events (calendar)
-- Adds the `assembly_events` table for service/meeting/event scheduling.
-- ============================================================

CREATE TABLE IF NOT EXISTS assembly_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ,
  is_all_day  BOOLEAN NOT NULL DEFAULT FALSE,
  category    TEXT NOT NULL DEFAULT 'service',
  created_by  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assembly_events_start_date ON assembly_events(start_date);
CREATE INDEX IF NOT EXISTS idx_assembly_events_category_date ON assembly_events(category, start_date);
