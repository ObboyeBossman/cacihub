import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export type BulkProvisionResult = {
  memberId: string;
  fullName: string;
  status: "provisioned" | "skipped_no_phone" | "skipped_phone_taken" | "skipped_already_linked" | "error";
  phone?: string;
  error?: string;
};

/**
 * POST /api/accounts/bulk-provision
 * Body: { memberIds: string[] }
 *
 * For each member ID:
 *   - Skip if already linked to an account.
 *   - Skip if no phone on the member record.
 *   - Skip if phone already exists in user_profiles (keeps first).
 *   - Otherwise provision a user_profiles account and link it.
 *
 * Returns a per-member result array so the UI can show exactly what happened.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { memberIds } = body as { memberIds: string[] };

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return NextResponse.json({ error: "memberIds must be a non-empty array." }, { status: 400 });
  }

  if (memberIds.length > 100) {
    return NextResponse.json({ error: "Maximum 100 members per bulk provision request." }, { status: 400 });
  }

  // Fetch all requested members in one query
  const members = await db.member.findMany({
    where: { id: { in: memberIds }, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      whatsappNumber: true,
      authUserId: true,
    },
  });

  // Resolve default password once
  const settings = await db.assemblySetting.findFirst();
  const defaultPassword = settings?.defaultPassword || "CACI@2026!";
  const passwordHash = await hashPassword(defaultPassword);

  const results: BulkProvisionResult[] = [];

  for (const member of members) {
    // Already has an account
    if (member.authUserId) {
      results.push({ memberId: member.id, fullName: member.fullName, status: "skipped_already_linked" });
      continue;
    }

    const phone = member.phoneNumber ?? member.whatsappNumber ?? null;

    // No phone on record — skip
    if (!phone) {
      results.push({ memberId: member.id, fullName: member.fullName, status: "skipped_no_phone" });
      continue;
    }

    // Phone already taken — skip
    const existing = await db.userProfile.findUnique({ where: { phone } });
    if (existing) {
      results.push({ memberId: member.id, fullName: member.fullName, status: "skipped_phone_taken", phone });
      continue;
    }

    try {
      await db.$executeRaw`SET LOCAL row_security = off`.catch(() => {});

      const newAccount = await db.userProfile.create({
        data: {
          fullName: member.fullName,
          phone,
          role: "member",
          passwordHash,
          isActive: true,
          mustChangePassword: true,
        },
      });

      await db.member.update({
        where: { id: member.id },
        data: { authUserId: newAccount.id },
      });

      results.push({ memberId: member.id, fullName: member.fullName, status: "provisioned", phone });
    } catch (err: any) {
      results.push({
        memberId: member.id,
        fullName: member.fullName,
        status: "error",
        phone,
        error: err?.message || "Unknown error",
      });
    }
  }

  const provisioned = results.filter((r) => r.status === "provisioned").length;
  const skipped = results.filter((r) => r.status.startsWith("skipped")).length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ results, summary: { provisioned, skipped, errors } }, { status: 200 });
}