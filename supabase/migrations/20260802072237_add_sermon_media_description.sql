-- Add description field to sermon_media for per-item context in the media sequence
ALTER TABLE "sermon_media" ADD COLUMN IF NOT EXISTS "description" TEXT;
