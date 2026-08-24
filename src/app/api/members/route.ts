import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { normalizeGhanaPhone } from "@/lib/phone";
import { toTitleCase } from "@/lib/format";
import type { MemberDTO, MembershipStatus } from "@/lib/types";

export const runtime = "nodejs";

function toDTO(m: any, appRole?: string | null): MemberDTO {
  return {
    id: m.id,
    membershipNumber: m.membershipNumber,
    title: m.title,
    fullName: m.fullName,
    dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
    gender: m.gender,
    maritalStatus: m.maritalStatus,
    occupation: m.occupation,
    location: m.location,
    phoneNumber: m.phoneNumber,
    whatsappNumber: m.whatsappNumber,
    membershipStatus: m.membershipStatus as MembershipStatus,
    assemblyRole: m.assemblyRole,
    joinDate: m.joinDate ? m.joinDate.toISOString() : null,
    profilePhotoUrl: m.profilePhotoUrl,
    emergencyContactName: m.emergencyContactName,
    emergencyContactPhone: m.emergencyContactPhone,
    emergencyContactRelationship: m.emergencyContactRelationship,
    isActive: m.isActive,
    deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
    authUserId: m.authUserId,
    appRole: (appRole as "admin" | "member" | null) ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    groupCount: 0,
    permissions: [],
  };
}

// GET /api/members?[q=...][&status=...][&id=...]
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const status = searchParams.get("status") || "";
  const id = searchParams.get("id");
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  // Single member by id
  if (id) {
    const member = await db.member.findUnique({
      where: { id },
    });
    if (!member || (member.deletedAt && !includeDeleted)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Fetch the linked user_profile role so the detail view can display Admin vs Member
    let appRole: string | null = null;
    if (member.authUserId) {
      const profile = await db.userProfile.findUnique({
        where: { id: member.authUserId },
        select: { role: true },
      });
      appRole = profile?.role ?? null;
    }
    return NextResponse.json({ member: toDTO(member, appRole) });
  }

  // Members can only see active, non-deleted, and limited
  const where: any = {};
  if (!includeDeleted) where.deletedAt = null;
  if (status) where.membershipStatus = status;
  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { membershipNumber: { contains: q } },
      { phoneNumber: { contains: q } },
      { assemblyRole: { contains: q } },
      { occupation: { contains: q } },
    ];
  }

  const members = await db.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ members: members.map((m) => toDTO(m)) });
}

// POST /api/members (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    title, fullName, gender, maritalStatus, occupation, location,
    phoneNumber, whatsappNumber, membershipStatus, assemblyRole,
    dateOfBirth, joinDate, emergencyContactName, emergencyContactPhone,
    emergencyContactRelationship,
  } = body;

  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  // Generate membership number — format: CACI-ASSAK-YYYY-NNNNN
  const counter = await db.memberCounter.upsert({
    where: { id: 1 },
    update: { lastNumber: { increment: 1 } },
    create: { id: 1, lastNumber: 1 },
  });
  const year = new Date().getFullYear();
  const membershipNumber = `CACI-ASSAK-${year}-${String(counter.lastNumber).padStart(5, "0")}`;

  // Normalise phone
  const normalizedPhone = phoneNumber ? normalizeGhanaPhone(phoneNumber) : null;
  const normalizedWhatsapp = whatsappNumber ? normalizeGhanaPhone(whatsappNumber) : normalizedPhone;

  const member = await db.member.create({
    data: {
      membershipNumber,
      title: title || null,
      fullName: toTitleCase(fullName.trim())!,
      gender: gender || null,
      maritalStatus: maritalStatus || null,
      occupation: toTitleCase(occupation) || null,
      location: toTitleCase(location) || null,
      phoneNumber: normalizedPhone,
      whatsappNumber: normalizedWhatsapp,
      membershipStatus: membershipStatus || "visitor",
      assemblyRole: toTitleCase(assemblyRole) || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      emergencyContactName: toTitleCase(emergencyContactName) || null,
      emergencyContactPhone: emergencyContactPhone ? normalizeGhanaPhone(emergencyContactPhone) : null,
      emergencyContactRelationship: toTitleCase(emergencyContactRelationship) || null,
      isActive: membershipStatus !== "inactive",
      createdById: session.id,
    },
  });

  // Audit log
  await db.memberAuditLog.create({
    data: {
      memberId: member.id,
      changedById: session.id,
      fieldChanged: "MEMBER_CREATED",
      oldValue: null,
      newValue: member.fullName,
    },
  });

  // ── Auto-provision a user_profiles account ──────────────────────────────
  // Rules:
  //   1. Skip if no phone number was provided.
  //   2. Skip if that phone already exists in user_profiles (keep the first).
  //   3. Otherwise create an account and link it back to this member.
  let accountProvisioned = false;
  if (normalizedPhone) {
    const existingAccount = await db.userProfile.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!existingAccount) {
      try {
        await db.$executeRaw`SET LOCAL row_security = off`;

        const settings = await db.assemblySetting.findFirst();
        const defaultPassword = settings?.defaultPassword || "CACI@2026!";
        const passwordHash = await hashPassword(defaultPassword);

        const newAccount = await db.userProfile.create({
          data: {
            fullName: member.fullName,
            phone: normalizedPhone,
            role: "member",
            passwordHash,
            isActive: true,
            mustChangePassword: true,
          },
        });

        // Link the account back to the member record
        await db.member.update({
          where: { id: member.id },
          data: { authUserId: newAccount.id },
        });

        accountProvisioned = true;
      } catch (provisionErr) {
        // Non-fatal — member record is already saved. Log and continue.
        console.error("[POST /api/members] auto-provision failed:", provisionErr);
      }
    }
  }

  return NextResponse.json({ member: toDTO(member), accountProvisioned }, { status: 201 });
}

// PATCH /api/members — admins can update any field; members can update their own profile (non-sensitive fields only)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Member id is required." }, { status: 400 });

  const isAdmin = session.role === "admin";

  // Members can only update their own record
  if (!isAdmin) {
    const selfMember = await db.member.findUnique({
      where: { id },
      select: { authUserId: true },
    });
    if (!selfMember) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (selfMember.authUserId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Strip admin-only fields from member self-update requests
    // profilePhotoUrl is intentionally excluded — members may update their own photo
    const adminOnlyFields = ["membershipStatus", "assemblyRole", "isActive", "deletedAt"];
    for (const f of adminOnlyFields) delete updates[f];
  }

  const existing = await db.member.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build update payload with normalisation
  const data: any = {};
  // Fields that get Title Case normalisation applied
  const titleCaseFields = new Set([
    "fullName", "occupation", "location", "assemblyRole",
    "emergencyContactName", "emergencyContactRelationship",
  ]);
  const trackedFields = [
    "title", "fullName", "gender", "maritalStatus", "occupation", "location",
    "membershipStatus", "assemblyRole", "emergencyContactName",
    "emergencyContactRelationship", "profilePhotoUrl",
  ];
  for (const f of trackedFields) {
    if (updates[f] !== undefined) {
      data[f] = titleCaseFields.has(f)
        ? toTitleCase(updates[f]) || null
        : updates[f] || null;
    }
  }
  if (updates.phoneNumber !== undefined) {
    data.phoneNumber = updates.phoneNumber ? normalizeGhanaPhone(updates.phoneNumber) : null;
  }
  if (updates.whatsappNumber !== undefined) {
    data.whatsappNumber = updates.whatsappNumber ? normalizeGhanaPhone(updates.whatsappNumber) : null;
  }
  if (updates.emergencyContactPhone !== undefined) {
    data.emergencyContactPhone = updates.emergencyContactPhone ? normalizeGhanaPhone(updates.emergencyContactPhone) : null;
  }
  if (updates.dateOfBirth !== undefined) {
    data.dateOfBirth = updates.dateOfBirth ? new Date(updates.dateOfBirth) : null;
  }
  if (updates.joinDate !== undefined) {
    data.joinDate = updates.joinDate ? new Date(updates.joinDate) : null;
  }
  if (updates.membershipStatus !== undefined) {
    data.isActive = updates.membershipStatus !== "inactive";
  }

  // Write audit entries for changed tracked fields
  const auditTracked = [
    "title", "fullName", "dateOfBirth", "gender", "maritalStatus", "occupation",
    "location", "phoneNumber", "whatsappNumber", "membershipStatus", "joinDate",
    "assemblyRole", "emergencyContactName", "emergencyContactPhone",
    "emergencyContactRelationship",
  ];

  const auditEntries: any[] = [];
  for (const f of auditTracked) {
    if (updates[f] === undefined) continue;
    const oldVal = (existing as any)[f];
    const newVal = data[f] ?? null;
    const oldStr = oldVal instanceof Date ? oldVal.toISOString() : (oldVal ?? null);
    const newStr = newVal instanceof Date ? newVal.toISOString() : (newVal ?? null);
    if (String(oldStr) !== String(newStr)) {
      auditEntries.push({
        memberId: id,
        changedById: session.id,
        fieldChanged: f,
        oldValue: oldStr ? String(oldStr) : null,
        newValue: newStr ? String(newStr) : null,
      });
    }
  }

  const updated = await db.member.update({
    where: { id },
    data,
  });

  if (auditEntries.length > 0) {
    await db.memberAuditLog.createMany({ data: auditEntries });
  }

  return NextResponse.json({ member: toDTO(updated) });
}

// DELETE /api/members (admin only) — soft delete
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.member.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete
  const updated = await db.member.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await db.memberAuditLog.create({
    data: {
      memberId: id,
      changedById: session.id,
      fieldChanged: "MEMBER_DELETED",
      oldValue: existing.fullName,
      newValue: null,
    },
  });

  return NextResponse.json({ ok: true, member: toDTO(updated) });
}
