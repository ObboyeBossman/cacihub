import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { AttendanceDTO, AttendanceSummaryDTO, ServiceType } from "@/lib/types";

export const runtime = "nodejs";

const VALID_SERVICES: ServiceType[] = [
  "sunday_first",
  "sunday_second",
  "midweek",
  "friday",
  "special",
];

function isServiceType(v: string): v is ServiceType {
  return (VALID_SERVICES as string[]).includes(v);
}

function toDTO(a: any): AttendanceDTO {
  return {
    id: a.id,
    memberId: a.memberId,
    memberName: a.member?.fullName ?? "Unknown",
    serviceType: a.serviceType as ServiceType,
    serviceDate: a.serviceDate.toISOString().split("T")[0],
    present: a.present,
    note: a.note ?? null,
    recordedByName: a.recordedBy?.fullName ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

// GET /api/attendance?[date=YYYY-MM-DD][&serviceType=...][&memberId=...][&summary=true]
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceType = searchParams.get("serviceType");
  const memberId = searchParams.get("memberId");
  const summary = searchParams.get("summary") === "true";

  // ── Summary mode: present/absent counts for a given date+service ──
  if (summary) {
    if (!date) {
      return NextResponse.json({ error: "date is required for summary" }, { status: 400 });
    }
    const svc = serviceType && isServiceType(serviceType) ? serviceType : undefined;

    const where = {
      serviceDate: new Date(date),
      ...(svc ? { serviceType: svc } : {}),
    };
    const records = await db.attendance.findMany({
      where,
      select: { present: true },
    });
    const presentCount = records.filter((r) => r.present).length;
    const absentCount = records.length - presentCount;

    // Total active members for rate calculation
    const totalMembers = await db.member.count({
      where: { deletedAt: null, isActive: true },
    });

    if (svc) {
      const result: AttendanceSummaryDTO = {
        serviceType: svc,
        serviceDate: date,
        presentCount,
        absentCount,
        totalMembers,
      };
      return NextResponse.json({ summary: result });
    }

    // No service filter: return one summary per service type that has records
    const byService = await db.attendance.groupBy({
      by: ["serviceType"],
      where: { serviceDate: new Date(date) },
      _count: { present: true },
    });
    const summaries: AttendanceSummaryDTO[] = VALID_SERVICES.map((st) => {
      const row = byService.find((r) => r.serviceType === st);
      return {
        serviceType: st,
        serviceDate: date,
        presentCount: row?._count.present ?? 0,
        absentCount: 0,
        totalMembers,
      };
    }).filter((s) => s.presentCount > 0);
    return NextResponse.json({ summaries });
  }

  // ── Detail mode: list records ──
  const where: any = {};
  if (date) where.serviceDate = new Date(date);
  if (serviceType && isServiceType(serviceType)) where.serviceType = serviceType;
  if (memberId) where.memberId = memberId;

  const records = await db.attendance.findMany({
    where,
    include: {
      member: { select: { fullName: true } },
      recordedBy: { select: { fullName: true } },
    },
    orderBy: { serviceDate: "desc" },
    take: 500,
  });

  return NextResponse.json({ attendance: records.map(toDTO) });
}

// POST /api/attendance — record a single member's attendance (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { memberId, serviceType, serviceDate, present, note } = body as {
    memberId?: string;
    serviceType?: string;
    serviceDate?: string;
    present?: boolean;
    note?: string;
  };

  if (!memberId || !serviceType || !serviceDate) {
    return NextResponse.json(
      { error: "memberId, serviceType, and serviceDate are required." },
      { status: 400 },
    );
  }
  if (!isServiceType(serviceType)) {
    return NextResponse.json({ error: "Invalid service type." }, { status: 400 });
  }

  const dateObj = new Date(serviceDate);
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  // Verify member exists
  const member = await db.member.findUnique({ where: { id: memberId }, select: { id: true } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  // Upsert: one record per member+service+date
  const record = await db.attendance.upsert({
    where: {
      memberId_serviceType_serviceDate: {
        memberId,
        serviceType,
        serviceDate: dateObj,
      },
    },
    create: {
      memberId,
      serviceType,
      serviceDate: dateObj,
      present: present ?? true,
      note: note?.trim() || null,
      recordedById: session.id,
    },
    update: {
      present: present ?? true,
      note: note?.trim() || null,
      recordedById: session.id,
    },
    include: {
      member: { select: { fullName: true } },
      recordedBy: { select: { fullName: true } },
    },
  });

  return NextResponse.json({ attendance: toDTO(record) }, { status: 201 });
}

// PUT /api/attendance — bulk record attendance (admin only)
// Body: { serviceType, serviceDate, records: [{ memberId, present }] }
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { serviceType, serviceDate, records } = body as {
    serviceType?: string;
    serviceDate?: string;
    records?: { memberId: string; present: boolean }[];
  };

  if (!serviceType || !serviceDate || !Array.isArray(records)) {
    return NextResponse.json(
      { error: "serviceType, serviceDate, and records[] are required." },
      { status: 400 },
    );
  }
  if (!isServiceType(serviceType)) {
    return NextResponse.json({ error: "Invalid service type." }, { status: 400 });
  }

  const dateObj = new Date(serviceDate);
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  // Upsert each record in parallel
  await Promise.all(
    records.map((r) =>
      db.attendance.upsert({
        where: {
          memberId_serviceType_serviceDate: {
            memberId: r.memberId,
            serviceType,
            serviceDate: dateObj,
          },
        },
        create: {
          memberId: r.memberId,
          serviceType,
          serviceDate: dateObj,
          present: r.present,
          recordedById: session.id,
        },
        update: {
          present: r.present,
          recordedById: session.id,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true, count: records.length });
}
