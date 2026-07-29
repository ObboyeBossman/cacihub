-- ============================================================
-- Migration: add_sermon_series
-- Adds sermon_series table and extends sermons with series fields
-- Run: supabase db push
-- ============================================================

-- sermon_series table
CREATE TABLE IF NOT EXISTS sermon_series (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT        NOT NULL,
  description TEXT,
  theme       TEXT,
  anchor_text TEXT,
  cover_image TEXT,
  year        INT         NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::int,
  status      TEXT        NOT NULL DEFAULT 'ongoing',   -- 'ongoing' | 'completed'
  start_date  TIMESTAMPTZ,
  end_date    TIMESTAMPTZ,
  created_by  TEXT        REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sermon_series_status ON sermon_series(status);
CREATE INDEX IF NOT EXISTS idx_sermon_series_year   ON sermon_series(year);

-- Extend sermons table (all columns are additive / nullable — zero downtime)
ALTER TABLE sermons
  ADD COLUMN IF NOT EXISTS series_id          TEXT        REFERENCES sermon_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sequence           INT         NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS theme              TEXT,
  ADD COLUMN IF NOT EXISTS quotations         JSONB       NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS duration_seconds   INT;

CREATE INDEX IF NOT EXISTS idx_sermons_series_id       ON sermons(series_id);
CREATE INDEX IF NOT EXISTS idx_sermons_series_sequence ON sermons(series_id, sequence);

-- updated_at trigger (shared function — idempotent)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to sermon_series
DROP TRIGGER IF EXISTS trg_sermon_series_updated_at ON sermon_series;
CREATE TRIGGER trg_sermon_series_updated_at
  BEFORE UPDATE ON sermon_series
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
# sermon_series migration applied via GitHub integration
