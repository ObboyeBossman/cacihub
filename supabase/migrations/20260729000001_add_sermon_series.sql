-- ============================================================
-- Migration: add_sermon_series
-- Adds sermon_series table and extends sermons with series fields
-- Run: supabase db push
-- ============================================================

-- sermon_series table
CREATE TABLE IF NOT EXISTS public.sermon_series (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  theme       TEXT,
  anchor_text TEXT,
  cover_image TEXT,
  year        INT         NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::int,
  status      TEXT        NOT NULL DEFAULT 'ongoing',   -- 'ongoing' | 'completed'
  start_date  TIMESTAMPTZ,
  end_date    TIMESTAMPTZ,
  created_by  TEXT        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sermon_series_status ON public.sermon_series(status);
CREATE INDEX IF NOT EXISTS idx_sermon_series_year   ON public.sermon_series(year);

-- RLS off — access controlled by custom auth at the API layer
ALTER TABLE public.sermon_series DISABLE ROW LEVEL SECURITY;

-- Extend sermons table (all columns are additive / nullable — zero downtime)
ALTER TABLE public.sermons
  ADD COLUMN IF NOT EXISTS series_id          UUID        REFERENCES public.sermon_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sequence           INT         NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS theme              TEXT,
  ADD COLUMN IF NOT EXISTS quotations         JSONB       NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS duration_seconds   INT;

CREATE INDEX IF NOT EXISTS idx_sermons_series_id       ON public.sermons(series_id);
CREATE INDEX IF NOT EXISTS idx_sermons_series_sequence ON public.sermons(series_id, sequence);

-- Apply trigger to sermon_series
DROP TRIGGER IF EXISTS trg_sermon_series_updated_at ON public.sermon_series;
CREATE TRIGGER trg_sermon_series_updated_at
  BEFORE UPDATE ON public.sermon_series
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- sermon_series migration applied

