-- Migration: replace single audio_url/video_url columns with a
-- flexible sermon_media table that supports multiple media items
-- per sermon of any type (audio, video, document, image).

-- 1. Create sermon_media table
CREATE TABLE IF NOT EXISTS sermon_media (
  id          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  sermon_id   TEXT        NOT NULL,
  type        TEXT        NOT NULL, -- 'audio' | 'video' | 'document' | 'image'
  url         TEXT        NOT NULL,
  label       TEXT,
  sequence    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sermon_media_pkey PRIMARY KEY (id),
  CONSTRAINT sermon_media_sermon_id_fkey
    FOREIGN KEY (sermon_id) REFERENCES sermons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS sermon_media_sermon_id_idx
  ON sermon_media (sermon_id, sequence);

-- 2. Migrate existing audio_url and video_url data into sermon_media
INSERT INTO sermon_media (sermon_id, type, url, label, sequence)
SELECT id, 'audio', audio_url, 'Audio', 0
FROM sermons
WHERE audio_url IS NOT NULL AND audio_url <> '';

INSERT INTO sermon_media (sermon_id, type, url, label, sequence)
SELECT id, 'video', video_url, 'Video', 1
FROM sermons
WHERE video_url IS NOT NULL AND video_url <> '';

-- 3. Drop the old columns
ALTER TABLE sermons
  DROP COLUMN IF EXISTS audio_url,
  DROP COLUMN IF EXISTS video_url;
