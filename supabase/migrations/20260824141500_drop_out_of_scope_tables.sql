-- Migration: Drop out-of-scope tables and columns to align production Supabase database with simplified scope
-- Retained active tables: members, user_profiles, member_counter, member_audit_log, assembly_settings, sermons, sermon_media

-- 1. Remove obsolete series_id reference from sermons if present
ALTER TABLE IF EXISTS "sermons" DROP COLUMN IF EXISTS "series_id";

-- 2. Drop out-of-scope tables (with CASCADE to clean up foreign keys and constraints)
DROP TABLE IF EXISTS "assembly_events" CASCADE;
DROP TABLE IF EXISTS "attendance" CASCADE;
DROP TABLE IF EXISTS "broadcast_recipients" CASCADE;
DROP TABLE IF EXISTS "broadcasts" CASCADE;
DROP TABLE IF EXISTS "forum_messages" CASCADE;
DROP TABLE IF EXISTS "group_members" CASCADE;
DROP TABLE IF EXISTS "group_messages" CASCADE;
DROP TABLE IF EXISTS "groups" CASCADE;
DROP TABLE IF EXISTS "member_permissions" CASCADE;
DROP TABLE IF EXISTS "ministries" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "sermon_series" CASCADE;
DROP TABLE IF EXISTS "system_permissions" CASCADE;

-- 3. Drop obsolete enum types if present
DROP TYPE IF EXISTS "service_type" CASCADE;
