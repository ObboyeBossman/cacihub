-- ============================================================
-- Migration: drop_out_of_scope_tables
-- Removes all tables, enums, and constraints that are outside
-- the reduced scope: Membership + Sermons only.
--
-- Tables dropped:
--   sermon_series           (replaced by flat sermons)
--   attendance              (out of scope)
--   assembly_events         (out of scope)
--   event_recurrences       (out of scope)
--   broadcasts              (out of scope)
--   broadcast_recipients    (out of scope)
--   notifications           (out of scope)
--   forum_messages          (out of scope)
--   groups                  (out of scope)
--   group_members           (out of scope)
--   group_messages          (out of scope)
--   ministries              (out of scope)
--   system_permissions      (out of scope)
--   member_permissions      (out of scope)
--
-- Foreign key from sermons → sermon_series is removed first.
-- CASCADE on child tables handles ordering where needed.
-- ============================================================

-- 1. Drop FK from sermons.series_id → sermon_series before dropping the parent
ALTER TABLE sermons DROP CONSTRAINT IF EXISTS sermons_series_id_fkey;
ALTER TABLE sermons DROP COLUMN IF EXISTS series_id;

-- 2. Drop tables in dependency order (children before parents)

-- Group messages (references groups)
DROP TABLE IF EXISTS group_messages CASCADE;

-- Group members (references groups + members)
DROP TABLE IF EXISTS group_members CASCADE;

-- Groups
DROP TABLE IF EXISTS groups CASCADE;

-- Forum messages (references members / user_profiles)
DROP TABLE IF EXISTS forum_messages CASCADE;

-- Broadcast recipients (references broadcasts)
DROP TABLE IF EXISTS broadcast_recipients CASCADE;

-- Broadcasts
DROP TABLE IF EXISTS broadcasts CASCADE;

-- Notifications
DROP TABLE IF EXISTS notifications CASCADE;

-- Attendance
DROP TABLE IF EXISTS attendance CASCADE;

-- Event recurrences (references assembly_events)
DROP TABLE IF EXISTS event_recurrences CASCADE;

-- Assembly events
DROP TABLE IF EXISTS assembly_events CASCADE;

-- Ministries
DROP TABLE IF EXISTS ministries CASCADE;

-- Permissions
DROP TABLE IF EXISTS member_permissions CASCADE;
DROP TABLE IF EXISTS system_permissions CASCADE;

-- Sermon series (no longer needed — sermons are flat)
DROP TABLE IF EXISTS sermon_series CASCADE;

-- 3. Drop out-of-scope enums (IF EXISTS — safe if already absent)
DROP TYPE IF EXISTS broadcast_status CASCADE;
DROP TYPE IF EXISTS broadcast_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS event_recurrence_type CASCADE;
DROP TYPE IF EXISTS forum_message_type CASCADE;
DROP TYPE IF EXISTS group_type CASCADE;
DROP TYPE IF EXISTS group_role CASCADE;
DROP TYPE IF EXISTS ministry_type CASCADE;
DROP TYPE IF EXISTS permission_scope CASCADE;
DROP TYPE IF EXISTS series_status CASCADE;
