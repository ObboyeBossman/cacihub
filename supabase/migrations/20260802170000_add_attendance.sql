-- ============================================================
-- CACI Hub — Attendance tracking
-- Adds the `service_type` enum and `attendance` table.
-- ============================================================

-- Service type enum (matches Prisma ServiceType)
DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'sunday_first',
    'sunday_second',
    'midweek',
    'friday',
    'special'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  service_type  service_type NOT NULL,
  service_date  DATE NOT NULL,
  present       BOOLEAN NOT NULL DEFAULT TRUE,
  recorded_by   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One record per member per service per date
  UNIQUE (member_id, service_type, service_date)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_attendance_service_date ON attendance(service_date);
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, service_date);
CREATE INDEX IF NOT EXISTS idx_attendance_type_date ON attendance(service_type, service_date);
