import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/admin/migrate-membership-numbers
 *
 * One-time migration: converts membership numbers to the new format.
 *   CACI-00032          → CACI-ASSAK-2026-00032  (old DB trigger format)
 *   CACI/ASS/2026/032   → CACI-ASSAK-2026-00032  (previous app-generated format)
 *
 * Admin-only. Safe to call multiple times (already-migrated rows are skipped).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 1. Update the trigger function on the DB
  await db.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.assign_membership_number()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_next_number integer;
    BEGIN
      UPDATE public.member_counter
      SET    last_number = last_number + 1
      WHERE  id = 1
      RETURNING last_number INTO v_next_number;

      NEW.membership_number := 'CACI-ASSAK-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_next_number::text, 5, '0');

      RETURN NEW;
    END;
    $$;
  `);

  // 2. Fetch members that need migration
  const members = await db.member.findMany({
    select: { id: true, membershipNumber: true },
    where: {
      membershipNumber: { not: null },
    },
  });

  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const m of members) {
    const num = m.membershipNumber!;

    // Already in new format — skip
    if (num.startsWith("CACI-ASSAK-")) {
      skipped++;
      continue;
    }

    let newNum: string | null = null;

    // Old DB trigger format: CACI-00032  (exactly CACI- + 5 digits)
    const oldTriggerMatch = num.match(/^CACI-(\d{5})$/);
    if (oldTriggerMatch) {
      newNum = `CACI-ASSAK-2026-${oldTriggerMatch[1].padStart(5, "0")}`;
    }

    // App-generated format: CACI/ASS/2026/032
    const oldAppMatch = num.match(/^CACI\/ASS\/(\d{4})\/(\d+)$/);
    if (oldAppMatch) {
      newNum = `CACI-ASSAK-${oldAppMatch[1]}-${oldAppMatch[2].padStart(5, "0")}`;
    }

    if (!newNum) {
      skipped++;
      continue;
    }

    try {
      await db.member.update({
        where: { id: m.id },
        data: { membershipNumber: newNum },
      });
      migrated++;
    } catch (err: any) {
      errors.push(`${m.id}: ${err.message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    summary: {
      total: members.length,
      migrated,
      skipped,
      errors,
    },
  });
}
