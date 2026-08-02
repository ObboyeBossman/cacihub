import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/directory?[q=...]
 * Member-safe directory: returns active, non-deleted members with limited
 * public fields (name, title, role, phone, whatsapp). No sensitive data.
 * Authenticated (admin + member).
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  const where: any = {
    deletedAt: null,
    isActive: true,
    membershipStatus: { in: ["active", "visitor"] },
  };

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { assemblyRole: { contains: q, mode: "insensitive" } },
      { occupation: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  const members = await db.member.findMany({
    where,
    select: {
      id: true,
      title: true,
      fullName: true,
      assemblyRole: true,
      phoneNumber: true,
      whatsappNumber: true,
      membershipStatus: true,
      profilePhotoUrl: true,
      occupation: true,
      location: true,
    },
    orderBy: [{ assemblyRole: "asc" }, { fullName: "asc" }],
    take: 200,
  });

  return NextResponse.json({ members });
}
