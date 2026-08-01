-- Migration: replace broadcast_id FK with generic type + reference_id columns
-- This makes the notifications table extensible for any future entity type
-- (sermon, broadcast, event, group, system, etc.) without schema changes.

-- 1. Add new columns
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type        TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- 2. Migrate existing broadcast notifications
UPDATE notifications
SET type         = 'broadcast',
    reference_id = broadcast_id::TEXT
WHERE broadcast_id IS NOT NULL;

-- 3. Drop the old broadcast_id FK and column
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_broadcast_id_fkey,
  DROP COLUMN IF EXISTS broadcast_id;

-- 4. Add index on type + reference_id for efficient lookups
CREATE INDEX IF NOT EXISTS notifications_type_reference_id_idx
  ON notifications (type, reference_id);
