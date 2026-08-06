/**
 * CACI Hub — Member Registration Seed
 * Source: 14 physical registration forms (Christ Apostolic Church International,
 *         Assakae Central Assembly, Takoradi)
 *
 * Field mapping:
 *   Form "First + Middle + Last name" → Member.fullName
 *   Form "Date of birth"              → Member.dateOfBirth
 *   Form "Gender" checkbox            → Member.gender
 *   Form "Marital status" checkbox    → Member.maritalStatus
 *   Form "Status" checkbox            → Member.membershipStatus (visitor | active)
 *   Form "Phone number"               → Member.phoneNumber
 *   Form "WhatsApp number"            → Member.whatsappNumber
 *   Form "City / Town"                → Member.location
 *   Form "Occupation"                 → Member.occupation
 *   Form "Date joined"                → Member.joinDate
 *   Form "Emergency contact name"     → Member.emergencyContactName
 *   Form "Emergency contact phone"    → Member.emergencyContactPhone
 *   Form "Relationship" checkbox      → Member.emergencyContactRelationship
 *
 * Note: Seed runs with row security disabled via the admin route pattern
 *       (SET LOCAL row_security = off is handled in the API layer).
 *       Run this file directly with: npx ts-node --project tsconfig.json prisma/seed-members.ts
 *       Or integrate into prisma/seed.ts.
 */

import { PrismaClient, GenderType, MaritalStatusType, MembershipStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper: parse a date string from the handwritten forms (flexible formats)
// ---------------------------------------------------------------------------
function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  // Try DD/MM/YYYY, D/M/YYYY, DD-MM-YYYY, and plain year
  const ddmmyyyy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    return new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}T00:00:00.000Z`);
  }
  // "March 2020" style — use 1st of the month
  const monthYear = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    return new Date(`${monthYear[1]} 1, ${monthYear[2]}T00:00:00.000Z`);
  }
  // Plain year "2010"
  const yearOnly = raw.match(/^(\d{4})$/);
  if (yearOnly) {
    return new Date(`${yearOnly[1]}-01-01T00:00:00.000Z`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Seed data — 14 members extracted from physical forms
// ---------------------------------------------------------------------------
const members = [
  // ── Form 1 ──────────────────────────────────────────────────────────────
  {
    fullName: "Grace Baidoo",
    dateOfBirth: parseDate("30/06/1993"),
    gender: "female" as GenderType,
    maritalStatus: "single" as MaritalStatusType,
    membershipStatus: "visitor" as MembershipStatus,
    phoneNumber: "0240423257",
    whatsappNumber: null,
    location: null,
    occupation: "Trader",
    joinDate: parseDate("28/06/2026"),
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
  },

  // ── Form 2 ──────────────────────────────────────────────────────────────
  {
    fullName: "Christina Andeh",
    dateOfBirth: parseDate("06/04/1990"),
    gender: "female" as GenderType,
    maritalStatus: null,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0243452869",
    whatsappNumber: "0243452869",
    location: "Assakae",
    occupation: "Catering",
    joinDate: parseDate("21/04/2006"),
    emergencyContactName: "Samuel Adiankeh",
    emergencyContactPhone: "0246574430",
    emergencyContactRelationship: "Spouse",
  },

  // ── Form 3 ──────────────────────────────────────────────────────────────
  {
    fullName: "Hannah Quaicoo",
    dateOfBirth: parseDate("18/09/2002"),
    gender: "female" as GenderType,
    maritalStatus: "single" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0557540191",
    whatsappNumber: "0557540191",
    location: "Assakae-Abaase",
    occupation: null,
    joinDate: null,
    emergencyContactName: "Elizabeth Quaicoo",
    emergencyContactPhone: "0535369059",
    emergencyContactRelationship: "Parent",
  },

  // ── Form 4 ──────────────────────────────────────────────────────────────
  {
    fullName: "Lawrencia Abena Quaicoo",
    dateOfBirth: parseDate("29/05/2007"),
    gender: "female" as GenderType,
    maritalStatus: "single" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0337895627",
    whatsappNumber: null,
    location: "Adientem",
    occupation: null,
    joinDate: parseDate("March 2020"),
    emergencyContactName: "Lawrencia",
    emergencyContactPhone: "0337895627",
    emergencyContactRelationship: null,
  },

  // ── Form 5 ──────────────────────────────────────────────────────────────
  {
    fullName: "Mary Cobbinah",
    dateOfBirth: parseDate("08/03/1987"),
    gender: "female" as GenderType,
    maritalStatus: "married" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0546992325",
    whatsappNumber: null,
    location: "Assakae-Promiseland",
    occupation: "Trading",
    joinDate: parseDate("06/05/2026"),
    emergencyContactName: "Stephen Cobbinah",
    emergencyContactPhone: "0557096865",
    emergencyContactRelationship: "Spouse",
  },

  // ── Form 6 ──────────────────────────────────────────────────────────────
  // Note: Gender checkbox shows Male on form but name "Aut Anthoinette" suggests
  // likely Female — preserved as-read from form (male checkbox ticked).
  {
    fullName: "Aut Anthoinette Quaicoe",
    dateOfBirth: parseDate("06/03/1993"),
    gender: "male" as GenderType,
    maritalStatus: "single" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0557534497",
    whatsappNumber: null,
    location: "Assakae",
    occupation: "Trading",
    joinDate: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
  },

  // ── Form 7 ──────────────────────────────────────────────────────────────
  // First name: Muala, Middle name: Deborah — full name ordered per form layout
  {
    fullName: "Muala Deborah",
    dateOfBirth: parseDate("07/03/1991"),
    gender: "female" as GenderType,
    maritalStatus: "single" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0531582780",
    whatsappNumber: "0241394163",
    location: null,
    occupation: null,
    joinDate: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
  },

  // ── Form 8 ──────────────────────────────────────────────────────────────
  {
    fullName: "Rebecca Alama Muala",
    dateOfBirth: null,
    gender: "female" as GenderType,
    maritalStatus: "single" as MaritalStatusType,
    membershipStatus: "visitor" as MembershipStatus,
    phoneNumber: "0241394163",
    whatsappNumber: null,
    location: "Assakae after bridge, Takoradi",
    occupation: "Apprentice",
    joinDate: null,
    emergencyContactName: "Deborah Muala",
    emergencyContactPhone: "0241394163",
    emergencyContactRelationship: "Sibling",
  },

  // ── Form 9 ──────────────────────────────────────────────────────────────
  {
    fullName: "Edomai Afi Meleah",
    dateOfBirth: parseDate("20/07/1979"),
    gender: "male" as GenderType,
    maritalStatus: "married" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0248055536",
    whatsappNumber: null,
    location: "Xabia, Takoradi",
    occupation: "Driver",
    joinDate: parseDate("2010"),
    emergencyContactName: "Hannah Afi Meleah",
    emergencyContactPhone: "0545879343",
    emergencyContactRelationship: "Spouse",
  },

  // ── Form 10 ─────────────────────────────────────────────────────────────
  {
    fullName: "Kwao Lawrence Johnson",
    dateOfBirth: parseDate("20/09/1958"),
    gender: "male" as GenderType,
    maritalStatus: "married" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0243155613",
    whatsappNumber: null,
    location: "Asemasa-Agona Nkwanta, Western",
    occupation: null,
    joinDate: null,
    emergencyContactName: null,
    emergencyContactPhone: "0243155613",
    emergencyContactRelationship: null,
  },

  // ── Form 11 ─────────────────────────────────────────────────────────────
  {
    fullName: "Mrs. Rebecca Arthur",
    dateOfBirth: parseDate("13/05/1973"),
    gender: "female" as GenderType,
    maritalStatus: "married" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0243383062",
    whatsappNumber: "0243383062",
    location: "Race Course",
    occupation: "Business",
    joinDate: null,
    emergencyContactName: "Mrs. Abraham Arthur",
    emergencyContactPhone: "0244832933",
    emergencyContactRelationship: "Spouse",
  },

  // ── Form 12 ─────────────────────────────────────────────────────────────
  {
    fullName: "Ayishetu Bashiru",
    dateOfBirth: parseDate("11/06/2011"),
    gender: "female" as GenderType,
    maritalStatus: "single" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0267147068",
    whatsappNumber: null,
    location: "Assakae",
    occupation: "Student",
    joinDate: null,
    emergencyContactName: "Mary Quaicoo",
    emergencyContactPhone: "0203387744",
    emergencyContactRelationship: "Parent",
  },

  // ── Form 13 ─────────────────────────────────────────────────────────────
  {
    fullName: "Horlali Atpakli",
    dateOfBirth: parseDate("07/02/2004"),
    gender: "female" as GenderType,
    maritalStatus: "other" as MaritalStatusType,
    membershipStatus: "visitor" as MembershipStatus,
    phoneNumber: "0256695991",
    whatsappNumber: "0256695991",
    location: "Assakae, Western",
    occupation: "Fashion and Designing",
    joinDate: null,
    emergencyContactName: "Eric Essien",
    emergencyContactPhone: "0556478514",
    emergencyContactRelationship: "Other",
  },

  // ── Form 14 ─────────────────────────────────────────────────────────────
  {
    fullName: "Theresah Anond Andoh",
    dateOfBirth: parseDate("16/07/1986"),
    gender: "female" as GenderType,
    maritalStatus: "married" as MaritalStatusType,
    membershipStatus: "active" as MembershipStatus,
    phoneNumber: "0248813173",
    whatsappNumber: null,
    location: "Assakae",
    occupation: null,
    joinDate: null,
    emergencyContactName: "Prince Polley",
    emergencyContactPhone: "0257067434",
    emergencyContactRelationship: "Spouse",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🌱  Seeding ${members.length} members from physical registration forms…\n`);

  let created = 0;
  let skipped = 0;

  for (const data of members) {
    // Upsert on phoneNumber so re-running the seed is idempotent
    const existing = data.phoneNumber
      ? await prisma.member.findFirst({ where: { phoneNumber: data.phoneNumber } })
      : null;

    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${data.fullName}`);
      skipped++;
      continue;
    }

    await prisma.member.create({ data });
    console.log(`  ✅  Created: ${data.fullName}`);
    created++;
  }

  console.log(`\n✨  Done — ${created} created, ${skipped} skipped.\n`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
