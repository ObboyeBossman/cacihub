import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/seed - idempotent seed of demo data
export async function POST() {
  try {
    // 1. Member counter single row
    await db.memberCounter.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, lastNumber: 12 },
    });

    // 2. Admin user
    const adminPhone = "233244000001";
    const admin = await db.userProfile.upsert({
      where: { phone: adminPhone },
      update: {},
      create: {
        id: "admin-caci-001",
        role: "admin",
        fullName: "Pastor Emmanuel Mensah",
        isActive: true,
        mustChangePassword: false,
        phone: adminPhone,
        passwordHash: await hashPassword("CACI@2026!"),
      },
    });

    // 3. Members with linked user profiles (for demo logins)
    const sampleMembers = [
      {
        id: "member-001",
        title: "Mr",
        fullName: "Kwabena Owusu",
        gender: "male" as const,
        maritalStatus: "married" as const,
        occupation: "Civil Engineer",
        location: "Assakae, Takoradi",
        phone: "233244000002",
        membershipStatus: "active" as const,
        assemblyRole: "Elder",
        user: { id: "user-member-001", fullName: "Kwabena Owusu", phone: "233244000002", password: "CACI@2026!" },
      },
      {
        id: "member-002",
        title: "Mrs",
        fullName: "Abena Adjei",
        gender: "female" as const,
        maritalStatus: "married" as const,
        occupation: "Teacher",
        location: "Effia Kuma, Takoradi",
        phone: "233244000003",
        membershipStatus: "active" as const,
        assemblyRole: "Women's Leader",
        user: { id: "user-member-002", fullName: "Abena Adjei", phone: "233244000003", password: "CACI@2026!" },
      },
      {
        id: "member-003",
        title: "Brother",
        fullName: "Daniel Asare",
        gender: "male" as const,
        maritalStatus: "single" as const,
        occupation: "Software Developer",
        location: "Bankyim, Takoradi",
        phone: "233244000004",
        membershipStatus: "active" as const,
        assemblyRole: "Youth Leader",
        user: { id: "user-member-003", fullName: "Daniel Asare", phone: "233244000004", password: "CACI@2026!" },
      },
      {
        id: "member-004",
        title: "Sister",
        fullName: "Grace Mensimah",
        gender: "female" as const,
        maritalStatus: "single" as const,
        occupation: "Nurse",
        location: "Assakae, Takoradi",
        phone: "233244000005",
        membershipStatus: "active" as const,
        assemblyRole: "Usher",
        user: { id: "user-member-004", fullName: "Grace Mensimah", phone: "233244000005", password: "CACI@2026!" },
      },
      {
        id: "member-005",
        title: "Rev",
        fullName: "Samuel Boateng",
        gender: "male" as const,
        maritalStatus: "married" as const,
        occupation: "Pastor",
        location: "Assakae, Takoradi",
        phone: "233244000006",
        membershipStatus: "active" as const,
        assemblyRole: "Associate Pastor",
        user: { id: "user-member-005", fullName: "Samuel Boateng", phone: "233244000006", password: "CACI@2026!" },
      },
    ];

    for (const m of sampleMembers) {
      const membershipNumber = `CACI/ASS/2026/${String(parseInt(m.id.replace("member-", ""))).padStart(3, "0")}`;
      const data: any = {
        id: m.id,
        membershipNumber,
        title: m.title,
        fullName: m.fullName,
        gender: m.gender,
        maritalStatus: m.maritalStatus,
        occupation: m.occupation,
        location: m.location,
        phoneNumber: m.phone,
        whatsappNumber: m.phone,
        membershipStatus: m.membershipStatus,
        assemblyRole: m.assemblyRole,
        joinDate: new Date(Date.now() - Math.floor(Math.random() * 5 * 365 * 24 * 3600 * 1000)),
        emergencyContactName: m.maritalStatus === "married" ? `${m.fullName.split(" ")[1] || "Family"} Family` : "Next of Kin",
        emergencyContactPhone: "233244000099",
        emergencyContactRelationship: m.maritalStatus === "married" ? "Spouse" : "Sibling",
        isActive: m.membershipStatus !== "inactive",
        createdById: admin.id,
        dateOfBirth: new Date(1985 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      };

      if (m.user) {
        await db.userProfile.upsert({
          where: { phone: m.user.phone },
          update: {},
          create: {
            id: m.user.id,
            role: "member",
            fullName: m.user.fullName,
            isActive: true,
            mustChangePassword: false,
            phone: m.user.phone,
            passwordHash: await hashPassword(m.user.password),
          },
        });
        data.authUserId = m.user.id;
      }

      await db.member.upsert({
        where: { id: m.id },
        update: data,
        create: data,
      });
    }

    // 4. Sermons
    const sermons = [
      {
        id: "sermon-001",
        title: "The Power of the Cross",
        speaker: "Pastor Emmanuel Mensah",
        speakerRole: "Head Pastor",
        date: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        summary: "A powerful Easter message on the finished work of Christ on the cross.",
        description: "Explore the eternal significance of Christ's sacrifice, redemption, and victory over sin.",
        theme: "Faith & Salvation",
        scriptureReference: "1 Corinthians 1:18",
        keyTakeaways: ["The cross is God's power unto salvation", "Victory is guaranteed through Christ"],
        sequence: 1,
      },
      {
        id: "sermon-002",
        title: "Walking in the Spirit",
        speaker: "Rev. Samuel Boateng",
        speakerRole: "Associate Pastor",
        date: new Date(Date.now() - 14 * 24 * 3600 * 1000),
        summary: "Understanding what it means to live a Spirit-led life day by day.",
        description: "Practical teachings on yielding to the Holy Spirit and producing spiritual fruit.",
        theme: "Christian Living",
        scriptureReference: "Galatians 5:16-25",
        keyTakeaways: ["Surrender daily to the Holy Spirit", "Fruitfulness is evidence of abiding"],
        sequence: 2,
      },
    ];

    for (const s of sermons) {
      await db.sermon.upsert({
        where: { id: s.id },
        update: {},
        create: {
          ...s,
          createdById: admin.id,
          coverImageUrl: null,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Seed complete.",
      credentials: {
        admin: { phone: "024 400 0001", password: "CACI@2026!" },
        member: { phone: "024 400 0002", password: "CACI@2026!" },
      },
    });
  } catch (err: any) {
    console.error("[seed] error", err);
    return NextResponse.json(
      { error: "Seed failed: " + (err?.message ?? String(err)) },
      { status: 500 },
    );
  }
}
