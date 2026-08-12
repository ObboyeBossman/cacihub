-- Migration: redesign sermon media model for one-of-each media types
-- and enrich the sermons table with fields used by the new UI.
--
-- Allowed media types per sermon (exactly one of each):
--   video | audio | pdf | text
--
-- Existing sermon_media rows are cleared because the application is
-- still in early data state and the previous type set is incompatible.

-- 1. Clear existing media so we can safely restructure
DELETE FROM sermon_media;

-- 2. Enrich sermons table
ALTER TABLE sermons
  ADD COLUMN IF NOT EXISTS speaker_role   TEXT,
  ADD COLUMN IF NOT EXISTS summary        TEXT,
  ADD COLUMN IF NOT EXISTS key_takeaways  JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Ensure description column already exists on sermon_media (from earlier migration)
ALTER TABLE sermon_media
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Enforce one media item per type per sermon
--    Drop any previous non-unique index that would conflict, then create unique constraint.
DROP INDEX IF EXISTS sermon_media_sermon_id_idx;

CREATE UNIQUE INDEX IF NOT EXISTS sermon_media_sermon_id_type_key
  ON sermon_media (sermon_id, type);

CREATE INDEX IF NOT EXISTS sermon_media_sermon_id_sequence_idx
  ON sermon_media (sermon_id, sequence);

-- 5. Optional: document the allowed type values via a check constraint
ALTER TABLE sermon_media
  DROP CONSTRAINT IF EXISTS sermon_media_type_check;

ALTER TABLE sermon_media
  ADD CONSTRAINT sermon_media_type_check
  CHECK (type IN ('video', 'audio', 'pdf', 'text'));
