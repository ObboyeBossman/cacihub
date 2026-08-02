import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { AssemblyEventDTO, EventCategory, RecurrenceType } from "@/lib/types";

export const runtime = "nodejs";

const VALID_CATEGORIES: EventCategory[] = [
  "service",
  "meeting",
  "conference",
  "retreat",
  "outreach",
  "other",
];

const VALID_RECURRENCES: RecurrenceType[] = ["none", "daily", "weekly", "monthly"];

function isCategory(v: string): v is EventCategory {
  return (VALID_CATEGORIES as string[]).includes(v);
}

function isRecurrence(v: string): v is RecurrenceType {
  return (VALID_RECURRENCES as string[]).includes(v);
}

function toDTO(e: any): AssemblyEventDTO {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    location: e.location ?? null,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    isAllDay: e.isAllDay,
    category: e.category as EventCategory,
    recurrence: (e.recurrence || "none") as RecurrenceType,
    recurrenceEndDate: e.recurrenceEndDate ? e.recurrenceEndDate.toISOString() : null,
    createdByName: e.creator?.fullName ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

/**
 * Expand a recurring event into virtual occurrences up to a horizon date.
 * Returns the original event (always) plus occurrences if recurrence != none.
 */
function expandRecurring(
  event: AssemblyEventDTO,
  horizon: Date,
  maxOccurrences: number = 50,
): AssemblyEventDTO[] {
  if (event.recurrence === "none" || !event.recurrence) return [event];

  const occurrences: AssemblyEventDTO[] = [event];
  const start = new Date(event.startDate);
  const recurrenceEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : null;
  const endBound = recurrenceEnd && recurrenceEnd < horizon ? recurrenceEnd : horizon;

  let current = new Date(start);
  let count = 0;
  while (count < maxOccurrences) {
    // Advance by the recurrence interval
    if (event.recurrence === "daily") current.setDate(current.getDate() + 1);
    else if (event.recurrence === "weekly") current.setDate(current.getDate() + 7);
    else if (event.recurrence === "monthly") current.setMonth(current.getMonth() + 1);
    else break;

    if (current > endBound) break;

    const duration = event.endDate
      ? new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
      : 0;
    const occEnd = duration > 0 ? new Date(current.getTime() + duration) : null;

    occurrences.push({
      ...event,
      id: `${event.id}__${count + 1}`, // virtual id for the occurrence
      startDate: current.toISOString(),
      endDate: occEnd ? occEnd.toISOString() : null,
    });
    count++;
  }
  return occurrences;
}

// GET /api/events?[upcoming=true][&limit=20][&from=ISO][&to=ISO]
// Authenticated (admin + member). Members see upcoming events; admins can filter by range.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (upcoming) {
    where.startDate = { gte: new Date() };
  } else if (from || to) {
    where.startDate = {};
    if (from) where.startDate.gte = new Date(from);
    if (to) where.startDate.lte = new Date(to);
  }

  const events = await db.assemblyEvent.findMany({
    where,
    include: { creator: { select: { fullName: true } } },
    orderBy: { startDate: "asc" },
    take: limit,
  });

  // Expand recurring events into virtual occurrences (up to 6 months ahead).
  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + 6);
  const expanded: AssemblyEventDTO[] = [];
  for (const e of events) {
    const dto = toDTO(e);
    expanded.push(...expandRecurring(dto, horizon));
  }
  // Re-sort by start date after expansion and cap to the requested limit.
  expanded.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const capped = expanded.slice(0, limit);

  return NextResponse.json({ events: capped });
}

// POST /api/events (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, description, location, startDate, endDate, isAllDay, category, notifyMembers, recurrence, recurrenceEndDate } = body as {
    title?: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isAllDay?: boolean;
    category?: string;
    notifyMembers?: boolean;
    recurrence?: string;
    recurrenceEndDate?: string;
  };

  if (!title?.trim() || !startDate) {
    return NextResponse.json(
      { error: "Title and start date are required." },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  }

  let end: Date | null = null;
  if (endDate) {
    end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid end date." }, { status: 400 });
    }
    if (end < start) {
      return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
    }
  }

  const cat = category && isCategory(category) ? category : "service";
  const rec = recurrence && isRecurrence(recurrence) ? recurrence : "none";
  let recEnd: Date | null = null;
  if (recurrenceEndDate) {
    recEnd = new Date(recurrenceEndDate);
    if (isNaN(recEnd.getTime())) recEnd = null;
  }

  const event = await db.assemblyEvent.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      startDate: start,
      endDate: end,
      isAllDay: isAllDay ?? false,
      category: cat,
      recurrence: rec,
      recurrenceEndDate: recEnd,
      createdBy: session.id,
    },
    include: { creator: { select: { fullName: true } } },
  });

  // Notify all active members (unless the admin explicitly opted out).
  if (notifyMembers !== false) {
    const members = await db.member.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (members.length > 0) {
      const dateLabel = start.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeLabel = event.isAllDay
        ? "All day"
        : start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const notifBody = `${dateLabel} at ${timeLabel}${location ? ` · ${location}` : ""}`;
      await db.notification.createMany({
        data: members.map((m) => ({
          memberId: m.id,
          type: "event",
          referenceId: event.id,
          title: `📅 ${event.title}`,
          body: notifBody,
        })),
      });
    }
  }

  return NextResponse.json({ event: toDTO(event) }, { status: 201 });
}

// PATCH /api/events (admin only) — update by id
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, title, description, location, startDate, endDate, isAllDay, category, recurrence, recurrenceEndDate } = body as {
    id?: string;
    title?: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isAllDay?: boolean;
    category?: string;
    recurrence?: string;
    recurrenceEndDate?: string;
  };

  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const existing = await db.assemblyEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const data: any = {};
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (location !== undefined) data.location = location?.trim() || null;
  if (startDate !== undefined) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
    data.startDate = start;
  }
  if (endDate !== undefined) {
    data.endDate = endDate ? new Date(endDate) : null;
  }
  if (isAllDay !== undefined) data.isAllDay = isAllDay;
  if (category !== undefined && isCategory(category)) data.category = category;
  if (recurrence !== undefined && isRecurrence(recurrence)) data.recurrence = recurrence;
  if (recurrenceEndDate !== undefined) {
    data.recurrenceEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
  }

  const event = await db.assemblyEvent.update({
    where: { id },
    data,
    include: { creator: { select: { fullName: true } } },
  });

  return NextResponse.json({ event: toDTO(event) });
}

// DELETE /api/events?id=... (admin only)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.assemblyEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
