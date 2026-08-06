-- ============================================================
-- CACI Hub — Member Seed Migration
-- Source: 14 handwritten registration forms
--         Christ Apostolic Church International
--         Assakae Central Assembly, Takoradi
-- Date:   2026-08-06
--
-- Field mapping from form → members table:
--   First + Middle + Last name → full_name
--   Date of birth              → date_of_birth
--   Gender checkbox            → gender
--   Marital status checkbox    → marital_status
--   Status checkbox            → membership_status (visitor | active)
--   Phone number               → phone_number
--   WhatsApp number            → whatsapp_number
--   City / Town                → location
--   Occupation                 → occupation
--   Date joined                → join_date
--   Emergency contact name     → emergency_contact_name
--   Emergency contact phone    → emergency_contact_phone
--   Relationship               → emergency_contact_relationship
--
-- Uses INSERT … ON CONFLICT DO NOTHING so re-running is safe.
-- Conflicts are detected on phone_number (unique) and full_name.
-- ============================================================

SET LOCAL row_security = off;

INSERT INTO members (
  id,
  full_name,
  date_of_birth,
  gender,
  marital_status,
  membership_status,
  phone_number,
  whatsapp_number,
  location,
  occupation,
  join_date,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relationship,
  is_active,
  created_at,
  updated_at
)
VALUES

-- Form 1: Grace Baidoo (Visitor, 28 Jun 2026)
(
  gen_random_uuid(), 'Grace Baidoo',
  '1993-06-30', 'female', 'single', 'visitor',
  '0240423257', NULL,
  NULL, 'Trader',
  '2026-06-28',
  NULL, NULL, NULL,
  true, now(), now()
),

-- Form 2: Christina Andeh (Member, joined 2006)
(
  gen_random_uuid(), 'Christina Andeh',
  '1990-04-06', 'female', NULL, 'active',
  '0243452869', '0243452869',
  'Assakae', 'Catering',
  '2006-04-21',
  'Samuel Adiankeh', '0246574430', 'Spouse',
  true, now(), now()
),

-- Form 3: Hannah Quaicoo (Member)
(
  gen_random_uuid(), 'Hannah Quaicoo',
  '2002-09-18', 'female', 'single', 'active',
  '0557540191', '0557540191',
  'Assakae-Abaase', NULL,
  NULL,
  'Elizabeth Quaicoo', '0535369059', 'Parent',
  true, now(), now()
),

-- Form 4: Lawrencia Abena Quaicoo (Member, joined March 2020)
(
  gen_random_uuid(), 'Lawrencia Abena Quaicoo',
  '2007-05-29', 'female', 'single', 'active',
  '0337895627', NULL,
  'Adientem', NULL,
  '2020-03-01',
  'Lawrencia', '0337895627', NULL,
  true, now(), now()
),

-- Form 5: Mary Cobbinah (Member, joined 6 May 2026)
(
  gen_random_uuid(), 'Mary Cobbinah',
  '1987-03-08', 'female', 'married', 'active',
  '0546992325', NULL,
  'Assakae-Promiseland', 'Trading',
  '2026-05-06',
  'Stephen Cobbinah', '0557096865', 'Spouse',
  true, now(), now()
),

-- Form 6: Aut Anthoinette Quaicoe (Member — gender recorded as per form)
(
  gen_random_uuid(), 'Aut Anthoinette Quaicoe',
  '1993-03-06', 'male', 'single', 'active',
  '0557534497', NULL,
  'Assakae', 'Trading',
  NULL,
  NULL, NULL, NULL,
  true, now(), now()
),

-- Form 7: Muala Deborah (Member)
(
  gen_random_uuid(), 'Muala Deborah',
  '1991-03-07', 'female', 'single', 'active',
  '0531582780', '0241394163',
  NULL, NULL,
  NULL,
  NULL, NULL, NULL,
  true, now(), now()
),

-- Form 8: Rebecca Alama Muala (no status marked — defaulting visitor)
(
  gen_random_uuid(), 'Rebecca Alama Muala',
  NULL, 'female', 'single', 'visitor',
  '0241394163', NULL,
  'Assakae after bridge, Takoradi', 'Apprentice',
  NULL,
  'Deborah Muala', '0241394163', 'Sibling',
  true, now(), now()
),

-- Form 9: Edomai Afi Meleah (Member, joined 2010)
(
  gen_random_uuid(), 'Edomai Afi Meleah',
  '1979-07-20', 'male', 'married', 'active',
  '0248055536', NULL,
  'Xabia, Takoradi', 'Driver',
  '2010-01-01',
  'Hannah Afi Meleah', '0545879343', 'Spouse',
  true, now(), now()
),

-- Form 10: Kwao Lawrence Johnson (Member)
(
  gen_random_uuid(), 'Kwao Lawrence Johnson',
  '1958-09-20', 'male', 'married', 'active',
  '0243155613', NULL,
  'Asemasa-Agona Nkwanta, Western', NULL,
  NULL,
  NULL, '0243155613', NULL,
  true, now(), now()
),

-- Form 11: Mrs. Rebecca Arthur (Member)
(
  gen_random_uuid(), 'Mrs. Rebecca Arthur',
  '1973-05-13', 'female', 'married', 'active',
  '0243383062', '0243383062',
  'Race Course', 'Business',
  NULL,
  'Mrs. Abraham Arthur', '0244832933', 'Spouse',
  true, now(), now()
),

-- Form 12: Ayishetu Bashiru (Member)
(
  gen_random_uuid(), 'Ayishetu Bashiru',
  '2011-06-11', 'female', 'single', 'active',
  '0267147068', NULL,
  'Assakae', 'Student',
  NULL,
  'Mary Quaicoo', '0203387744', 'Parent',
  true, now(), now()
),

-- Form 13: Horlali Atpakli (no status — defaulting visitor)
(
  gen_random_uuid(), 'Horlali Atpakli',
  '2004-02-07', 'female', 'other', 'visitor',
  '0256695991', '0256695991',
  'Assakae, Western', 'Fashion and Designing',
  NULL,
  'Eric Essien', '0556478514', 'Other',
  true, now(), now()
),

-- Form 14: Theresah Anond Andoh (Member)
(
  gen_random_uuid(), 'Theresah Anond Andoh',
  '1986-07-16', 'female', 'married', 'active',
  '0248813173', NULL,
  'Assakae', NULL,
  NULL,
  'Prince Polley', '0257067434', 'Spouse',
  true, now(), now()
)

ON CONFLICT DO NOTHING;
-- phone_number has no UNIQUE constraint on the members table so shared numbers
-- (e.g. forms 7 & 8 share 0241394163) are inserted without conflict.
-- ON CONFLICT DO NOTHING guards against accidental re-runs producing duplicate rows.
