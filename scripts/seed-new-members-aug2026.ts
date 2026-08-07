// =============================================================
// CACI Hub — New Member Registration Seed (August 2026 batch)
// Source: 14 physical registration forms, Christ Apostolic Church
//         International, Assakae Central Assembly, Takoradi
// Generated: 2026-08-07
//
// Field mapping (form label → DB column):
//   "First / Middle / Last name"  → fullName (concatenated; title stripped)
//   "Date of birth"               → dateOfBirth
//   "Gender" checkbox             → gender  (male | female)
//   "Marital status" checkbox     → maritalStatus  (single | married | other)
//   "Status" checkbox             → membershipStatus  (visitor | active)
//   "Occupation"                  → occupation
//   "City / Town"                 → location
//   "Phone number"                → phoneNumber  (E.164: 233XXXXXXXXX)
//   "WhatsApp number"             → whatsappNumber  (E.164)
//   "Date joined"                 → joinDate
//   "Emergency contact name"      → emergencyContactName
//   "Emergency contact phone"     → emergencyContactPhone  (E.164)
//   "Relationship" checkbox       → emergencyContactRelationship
//
// Phone normalisation: local 0XXXXXXXXX → 233XXXXXXXXX (E.164, Ghana).
// Membership numbers are sequential from CACI/ASS/2026/076 (the last
// number in the existing 75-member seed was 075).
// Member counter is bumped from 75 → 89 after insert.
//
// Idempotent: skips any member whose `id` already exists in the DB.
// =============================================================

import { db } from "../src/lib/db";

const members = [
  // ── Form 1 ─ Rebecca Alama Muala ───────────────────────────
  // Status: Visitor ✓  | Branch: Assakae Central
  // DOB: not written on form
  {
    id: "47a60bb8-eccb-4d4e-a1c3-42c71d8e9501",
    membershipNumber: "CACI/ASS/2026/076",
    title: null,
    fullName: "Rebecca Alama Muala",
    dateOfBirth: null,
    gender: "female",
    maritalStatus: "single",
    occupation: "Apprentice",
    location: "Assakae after bridge, Takoradi",
    phoneNumber: "233241394163",
    whatsappNumber: null,
    membershipStatus: "visitor",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: "Deborah Muala",
    emergencyContactPhone: "233241394163",
    emergencyContactRelationship: "Sibling",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 2 ─ Hannah Quaicoo ────────────────────────────────
  // Status: Member ✓  | Branch: (blank)
  // Heard: Friend / Family ✓
  {
    id: "47d5dece-fda3-415c-b47d-02ed041b34ff",
    membershipNumber: "CACI/ASS/2026/077",
    title: null,
    fullName: "Hannah Quaicoo",
    dateOfBirth: new Date("2002-09-18"),
    gender: "female",
    maritalStatus: "single",
    occupation: null,
    location: "Assakae-Abaase",
    phoneNumber: "233557540191",
    whatsappNumber: "233557540191",
    membershipStatus: "active",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: "Elizabeth Quaicoo",
    emergencyContactPhone: "233535369059",
    emergencyContactRelationship: "Parent",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 3 ─ Ayishetu Bashiru ──────────────────────────────
  // Status: Member ✓  | Branch: (blank)
  // DOB: 11/06/2011  | Heard: Other ✓
  {
    id: "8ba4f6fb-0542-4838-8ffd-df46cef3d4ef",
    membershipNumber: "CACI/ASS/2026/078",
    title: null,
    fullName: "Ayishetu Bashiru",
    dateOfBirth: new Date("2011-06-11"),
    gender: "female",
    maritalStatus: "single",
    occupation: "Student",
    location: "Assakae",
    phoneNumber: "233267147068",
    whatsappNumber: null,
    membershipStatus: "active",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: "Mary Quaicoo",
    emergencyContactPhone: "233203387744",
    emergencyContactRelationship: "Parent",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 4 ─ Horlali Atpakli ───────────────────────────────
  // Status: (no checkbox marked; treating as visitor — no branch/assembly listed)
  // DOB: 7/02/2004  | Nationality: Ghanaian  | Heard: Walk-in ✓
  // Gender: Female  | Marital: Other
  // Alt phone: 0592389132
  // Note: email field unclear (illegible); omitted.
  {
    id: "2c1af815-965c-4340-b717-55d975d8c3b8",
    membershipNumber: "CACI/ASS/2026/079",
    title: null,
    fullName: "Horlali Atpakli",
    dateOfBirth: new Date("2004-02-07"),
    gender: "female",
    maritalStatus: "other",
    occupation: "Fashion and Designing",
    location: "Assakae, Western",
    phoneNumber: "233256695991",
    whatsappNumber: "233256695991",
    membershipStatus: "visitor",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: "Eric Essien",
    emergencyContactPhone: "233556478514",
    emergencyContactRelationship: "Other",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 5 ─ Theresah Anond Andoh ─────────────────────────
  // Status: (no checkbox clearly marked; Branch/Assembly blank; treating visitor)
  // DOB: 16/07/1986  | Gender: Female  | Marital: Married
  // Heard: (none ticked)
  {
    id: "ae8e4c97-e935-48a0-88aa-4bc3f4782203",
    membershipNumber: "CACI/ASS/2026/080",
    title: null,
    fullName: "Theresah Anond Andoh",
    dateOfBirth: new Date("1986-07-16"),
    gender: "female",
    maritalStatus: "married",
    occupation: null,
    location: "Assakae",
    phoneNumber: "233248813173",
    whatsappNumber: null,
    membershipStatus: "visitor",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: "Prince Polley",
    emergencyContactPhone: "233257067434",
    emergencyContactRelationship: "Spouse",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 6 ─ Grace Baidoo ──────────────────────────────────
  // Status: Visitor ✓  | Date of visit: 28/06/2026
  // DOB: 30/06/1993  | Heard: Walk-in ✓ + Social media ✓
  // Date joined set to date of visit (28/06/2026)
  {
    id: "ae5c0221-1c63-4025-b665-aad14a8395fe",
    membershipNumber: "CACI/ASS/2026/081",
    title: null,
    fullName: "Grace Baidoo",
    dateOfBirth: new Date("1993-06-30"),
    gender: "female",
    maritalStatus: "single",
    occupation: "Trader",
    location: null,
    phoneNumber: "233240423257",
    whatsappNumber: null,
    membershipStatus: "visitor",
    joinDate: new Date("2026-06-28"),
    profilePhotoUrl: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 7 ─ Kwao Lawrence Johnson ────────────────────────
  // Status: Member ✓  | Branch: Asakae
  // DOB: 20th Sept 1958  | Nationality: Ahanta (stored in occupation col — N/A)
  // Gender: Male  | Marital: Married  | Occupation: (blank)
  // Emergency: no name written, phone repeated
  {
    id: "6188b245-1b54-4b81-9058-57b5419d3388",
    membershipNumber: "CACI/ASS/2026/082",
    title: null,
    fullName: "Kwao Lawrence Johnson",
    dateOfBirth: new Date("1958-09-20"),
    gender: "male",
    maritalStatus: "married",
    occupation: null,
    location: "Asemasa-Agona Nkwanta, Western",
    phoneNumber: "233243155613",
    whatsappNumber: null,
    membershipStatus: "active",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: null,
    emergencyContactPhone: "233243155613",
    emergencyContactRelationship: null,
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 8 ─ Aut Anthoinette Quaicoe ──────────────────────
  // Status: Member ✓  | Heard: Walk-in ✓
  // DOB: 06/03/1993  | Occupation: Trading
  // Gender: Male checkbox marked (form anomaly — name is female;
  //         preserved exactly as written on the physical form)
  // Marital: Single  | Emergency: blank
  // Note: "Aut" appears to be a title/nickname prefix used on the form.
  {
    id: "080394f1-7a09-46e6-bed5-634bc8af1654",
    membershipNumber: "CACI/ASS/2026/083",
    title: null,
    fullName: "Aut Anthoinette Quaicoe",
    dateOfBirth: new Date("1993-03-06"),
    gender: "male",  // preserved as marked on form; may need correction by admin
    maritalStatus: "single",
    occupation: "Trading",
    location: "Assakae",
    phoneNumber: "233557534497",
    whatsappNumber: null,
    membershipStatus: "active",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 9 ─ Edomai Afi Meleah ────────────────────────────
  // Status: Member ✓  | Branch: Assakae  | Date joined: 2010
  // DOB: 20/07/1979  | Nationality: Ghanaian  | Heard: Other → Member
  // Residential address: Xabia  | City: Takoradi  | Region: Western
  {
    id: "a6a0d854-d44a-4904-8824-b9ea2c73a65c",
    membershipNumber: "CACI/ASS/2026/084",
    title: null,
    fullName: "Edomai Afi Meleah",
    dateOfBirth: new Date("1979-07-20"),
    gender: "male",
    maritalStatus: "married",
    occupation: "Driver",
    location: "Xabia, Takoradi, Western",
    phoneNumber: "233248055536",
    whatsappNumber: null,
    membershipStatus: "active",
    joinDate: new Date("2010-01-01"),
    profilePhotoUrl: null,
    emergencyContactName: "Mrs Hannah Afi Meleah",
    emergencyContactPhone: "233545879343",
    emergencyContactRelationship: "Spouse",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 10 ─ Mary Cobbinah ────────────────────────────────
  // Status: Member ✓  | Date joined: 6/05/2026  | Heard: Walk-in ✓
  // DOB: 08/03/1987  | Location: Assakae-Promiseland
  {
    id: "1cc279a4-9228-46a5-9f9c-39c9368f4ebe",
    membershipNumber: "CACI/ASS/2026/085",
    title: null,
    fullName: "Mary Cobbinah",
    dateOfBirth: new Date("1987-03-08"),
    gender: "female",
    maritalStatus: "married",
    occupation: "Trading",
    location: "Assakae-Promiseland",
    phoneNumber: "233546992325",
    whatsappNumber: null,
    membershipStatus: "active",
    joinDate: new Date("2026-05-06"),
    profilePhotoUrl: null,
    emergencyContactName: "Stephen Cobbinah",
    emergencyContactPhone: "233557096865",
    emergencyContactRelationship: "Spouse",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 11 ─ Mrs. Rebecca Arthur ─────────────────────────
  // Status: Member ✓  | Heard: Other ✓
  // DOB: 13/05/1973  | Location: Race Course
  {
    id: "c3c95df7-ed6b-457b-b87e-81a7f0dfdeda",
    membershipNumber: "CACI/ASS/2026/086",
    title: "Mrs",
    fullName: "Rebecca Arthur",
    dateOfBirth: new Date("1973-05-13"),
    gender: "female",
    maritalStatus: "married",
    occupation: "Business",
    location: "Race Course",
    phoneNumber: "233243383062",
    whatsappNumber: "233243383062",
    membershipStatus: "active",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: "Mrs Abraham Arthur",
    emergencyContactPhone: "233244832933",
    emergencyContactRelationship: "Spouse",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 12 ─ Christina Andeh (upside-down image) ─────────
  // Status: Member ✓  | Date joined: 21/04/2006
  // DOB: 06/04/1990  | Heard: Walk-in ✓
  // Emergency: Samuel Adiankeh, 0246574430, Spouse
  {
    id: "dbe4642a-4247-428b-9df7-5bc1b26f0267",
    membershipNumber: "CACI/ASS/2026/087",
    title: null,
    fullName: "Christina Andeh",
    dateOfBirth: new Date("1990-04-06"),
    gender: "female",
    maritalStatus: null,
    occupation: "Catering",
    location: "Assakae",
    phoneNumber: "233243452869",
    whatsappNumber: "233243452869",
    membershipStatus: "active",
    joinDate: new Date("2006-04-21"),
    profilePhotoUrl: null,
    emergencyContactName: "Samuel Adiankeh",
    emergencyContactPhone: "233246574430",
    emergencyContactRelationship: "Spouse",
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 13 ─ Lawrencia Abena Quaicoo ─────────────────────
  // Status: Member ✓  | Date of visit: March 2020
  // DOB: 29/05/2007  | Nationality: Ghanaian  | Branch: Assakae
  // Heard: Friend / Family ✓  | Location: Adientem / Western
  // Residential address: B123
  // Emergency: Lawrencia (self-referential; same phone — unusual but preserved as written)
  {
    id: "aab542e6-5fcc-4f29-8fe5-7dd6315ab387",
    membershipNumber: "CACI/ASS/2026/088",
    title: null,
    fullName: "Lawrencia Abena Quaicoo",
    dateOfBirth: new Date("2007-05-29"),
    gender: "female",
    maritalStatus: "single",
    occupation: null,
    location: "Adientem, Western",
    phoneNumber: "233337895627",
    whatsappNumber: null,
    membershipStatus: "active",
    joinDate: new Date("2020-03-01"),
    profilePhotoUrl: null,
    emergencyContactName: "Lawrencia",
    emergencyContactPhone: "233337895627",
    emergencyContactRelationship: null,
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },

  // ── Form 14 ─ Muala Deborah ────────────────────────────────
  // Status: Member ✓  | No last name on form (first: Muala, middle: Deborah)
  // DOB: 07-03-1991  | Gender: Female  | Marital: Single
  // Nationality: Ghanaian  | Location: Eastern (After bridge)
  // Phone: 0531582780  | WhatsApp: 0241394163  | Heard: Friend / Family ✓
  // Emergency: blank
  {
    id: "4b0faae5-ad53-4124-afaa-309e6e916073",
    membershipNumber: "CACI/ASS/2026/089",
    title: null,
    fullName: "Muala Deborah",
    dateOfBirth: new Date("1991-03-07"),
    gender: "female",
    maritalStatus: "single",
    occupation: null,
    location: "Eastern Region (After bridge)",
    phoneNumber: "233531582780",
    whatsappNumber: "233241394163",
    membershipStatus: "active",
    joinDate: null,
    profilePhotoUrl: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    isActive: true,
    createdAt: new Date("2026-08-07T00:00:00.000Z"),
    updatedAt: new Date("2026-08-07T00:00:00.000Z"),
  },
];

async function main() {
  console.log("\n🌱  Seeding 14 new members from physical registration forms (August 2026 batch)…\n");

  // Bump member counter from 75 → 89
  await db.memberCounter.upsert({
    where: { id: 1 },
    update: { lastNumber: 89 },
    create: { id: 1, lastNumber: 89 },
  });
  console.log("  member_counter -> { lastNumber: 89 }");

  let created = 0;
  let skipped = 0;

  for (const m of members) {
    // Skip if ID already exists (idempotent)
    const existingById = await db.member.findUnique({ where: { id: m.id } });
    if (existingById) {
      console.log(`  ⏭  Skipped (id exists): ${m.fullName}`);
      skipped++;
      continue;
    }

    // Skip if membership number is already taken
    const existingByNum = await db.member.findUnique({
      where: { membershipNumber: m.membershipNumber },
    });
    if (existingByNum) {
      console.warn(`  ⚠️  Skipped (membership number taken): ${m.fullName} — ${m.membershipNumber}`);
      skipped++;
      continue;
    }

    await db.member.create({
      data: {
        id: m.id,
        membershipNumber: m.membershipNumber,
        title: m.title,
        fullName: m.fullName,
        dateOfBirth: m.dateOfBirth,
        gender: m.gender as any,
        maritalStatus: m.maritalStatus as any,
        occupation: m.occupation,
        location: m.location,
        phoneNumber: m.phoneNumber,
        whatsappNumber: m.whatsappNumber,
        membershipStatus: m.membershipStatus as any,
        joinDate: m.joinDate,
        profilePhotoUrl: m.profilePhotoUrl,
        emergencyContactName: m.emergencyContactName,
        emergencyContactPhone: m.emergencyContactPhone,
        emergencyContactRelationship: m.emergencyContactRelationship,
        isActive: m.isActive,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      },
    });
    console.log(`  ✅  Created: ${m.fullName}  (${m.membershipNumber})`);
    created++;
  }

  console.log(`\n✨  Done — ${created} created, ${skipped} skipped.\n`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
