import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { SermonDTO } from "@/lib/types";

export const runtime = "nodejs";

function toDTO(s: any): SermonDTO {
  return {
    id: s.id,
    seriesId: s.seriesId,
    seriesTitle: s.series?.title ?? null,
    sequence: s.sequence,
    title: s.title,
    speaker: s.speaker,
    date: s.date.toISOString(),
    description: s.description,
    theme: s.theme,
    scriptureReference: s.scriptureReference,
    quotations: Array.isArray(s.quotations) ? s.quotations : [],
    media: (s.media ?? []).map((m: any) => ({
      id: m.id,
      sermonId: m.sermonId,
      type: m.type,
      url: m.url,
      label: m.label ?? null,
      description: m.description ?? null,
      sequence: m.sequence,
    })),
    coverImageUrl: s.coverImageUrl,
    durationSeconds: s.durationSeconds,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

const WITH_SERIES_AND_MEDIA = {
  series: { select: { title: true } },
  media: { orderBy: { sequence: "asc" as const } },
};

const WITH_SERIES_ONLY = {
  series: { select: { title: true } },
};

// ── Resilient read helpers (graceful fallback if sermon_media isn't yet
//    visible to this Prisma client build — avoids 500 on cold-start race)

async function findSermonWithMedia(where: any): Promise<any> {
  try {
    return await db.sermon.findUnique({ where, include: WITH_SERIES_AND_MEDIA });
  } catch (e: any) {
    console.error("[sermons GET] media include failed, retrying without:", e?.message);
    return db.sermon.findUnique({ where, include: WITH_SERIES_ONLY });
  }
}

async function findSermonsWithMedia(where: any, orderBy: any): Promise<any[]> {
  try {
    return await db.sermon.findMany({ where, orderBy, take: 200, include: WITH_SERIES_AND_MEDIA });
  } catch (e: any) {
    console.error("[sermons GET] list media include failed, retrying without:", e?.message);
    return db.sermon.findMany({ where, orderBy, take: 200, include: WITH_SERIES_ONLY });
  }
}

// ── GET /api/sermons

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const seriesId = searchParams.get("seriesId");

    if (id) {
      const sermon = await findSermonWithMedia({ id });
      if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ sermon: toDTO(sermon) });
    }

    const where = seriesId ? { seriesId } : {};
    const orderBy = seriesId ? [{ sequence: "asc" as const }] : [{ date: "desc" as const }];
    const sermons = await findSermonsWithMedia(where, orderBy);
    return NextResponse.json({ sermons: sermons.map(toDTO) });
  } catch (err: any) {
    console.error("[sermons GET]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to load sermons" }, { status: 500 });
  }
}

// ── POST /api/sermons (admin)

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
      title, speaker, date, description, theme, scriptureReference,
      quotations, media, coverImageUrl, durationSeconds, seriesId, sequence,
    } = body;

    if (!title?.trim() || !speaker?.trim() || !date) {
      return NextResponse.json({ error: "Title, speaker, and date are required." }, { status: 400 });
    }

    let seq = Number(sequence) || 1;
    if (seriesId && !sequence) {
      const last = await db.sermon.findFirst({
        where: { seriesId },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      seq = last ? last.sequence + 1 : 1;
    }

    const sermonData = {
      title: title.trim(),
      speaker: speaker.trim(),
      date: new Date(date),
      description: description || null,
      theme: theme || null,
      scriptureReference: scriptureReference || null,
      quotations: Array.isArray(quotations) ? quotations : [],
      coverImageUrl: coverImageUrl || null,
      durationSeconds: durationSeconds ? Number(durationSeconds) : null,
      seriesId: seriesId || null,
      sequence: seq,
    };

    // Try creating with nested media; if the media relation isn't available in
    // this Prisma build (migration/build timing race), create sermon then insert
    // media separately.
    let sermon: any;
    try {
      sermon = await db.sermon.create({
        data: {
          ...sermonData,
          createdById: session.id,
          media: Array.isArray(media) && media.length > 0
            ? {
                create: media.map((m: any, i: number) => ({
                  type: m.type,
                  url: m.url,
                  label: m.label || null,
                  description: m.description || null,
                  sequence: i,
                })),
              }
            : undefined,
        },
        include: WITH_SERIES_AND_MEDIA,
      });
    } catch (createErr: any) {
      console.error("[sermons POST] create with media failed:", createErr?.message);

      // FK on createdById? retry without it
      const isFK = createErr?.code === "P2003" || createErr?.code === "23503";

      // Create the sermon row first (without nested media to avoid compounding errors)
      sermon = await db.sermon.create({
        data: {
          ...sermonData,
          createdById: isFK ? null : session.id,
        },
        include: WITH_SERIES_ONLY,
      });
      sermon.media = [];

      // Now try inserting media rows separately
      if (Array.isArray(media) && media.length > 0) {
        try {
          await db.sermonMedia.createMany({
            data: media.map((m: any, i: number) => ({
              sermonId: sermon.id,
              type: m.type,
              url: m.url,
              label: m.label || null,
              description: m.description || null,
              sequence: i,
            })),
          });
          // Re-fetch to get the media rows attached
          const refetched = await db.sermon.findUnique({
            where: { id: sermon.id },
            include: WITH_SERIES_AND_MEDIA,
          }).catch(() => null);
          if (refetched) sermon = refetched;
        } catch (mediaErr: any) {
          console.error("[sermons POST] separate media insert failed:", mediaErr?.message);
          // Sermon was created — just return it without media rather than failing
        }
      }
    }

    // Auto-notify all active members
    try {
      const activeMembers = await db.member.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      if (activeMembers.length > 0) {
        const seriesName = sermon.series?.title ? ` — ${sermon.series.title}` : "";
        await db.notification.createMany({
          data: activeMembers.map((m: any) => ({
            memberId: m.id,
            type: "sermon",
            referenceId: sermon.id,
            title: "New Sermon Available",
            body: `${sermon.title} by ${sermon.speaker}${seriesName}`,
          })),
          skipDuplicates: true,
        });
      }
    } catch (notifErr) {
      console.error("[sermons POST] notification error:", notifErr);
    }

    return NextResponse.json({ sermon: toDTO(sermon) }, { status: 201 });
  } catch (err: any) {
    console.error("[sermons POST]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to add sermon" }, { status: 500 });
  }
}

// ── PATCH /api/sermons (admin) — body: { id, ...updates }

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, media, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: any = {};
    for (const f of ["title", "speaker", "description", "theme", "scriptureReference", "coverImageUrl"]) {
      if (updates[f] !== undefined) data[f] = updates[f] || null;
    }
    if (updates.title) data.title = updates.title.trim();
    if (updates.speaker) data.speaker = updates.speaker.trim();
    if (updates.date) data.date = new Date(updates.date);
    if (updates.quotations !== undefined) data.quotations = Array.isArray(updates.quotations) ? updates.quotations : [];
    if (updates.durationSeconds !== undefined) data.durationSeconds = updates.durationSeconds ? Number(updates.durationSeconds) : null;
    if (updates.seriesId !== undefined) data.seriesId = updates.seriesId || null;
    if (updates.sequence !== undefined) data.sequence = Number(updates.sequence);

    // Replace all media if provided — use separate ops so a missing relation
    // doesn't block the field update
    if (Array.isArray(media)) {
      try {
        await db.sermonMedia.deleteMany({ where: { sermonId: id } });
        if (media.length > 0) {
          await db.sermonMedia.createMany({
            data: media.map((m: any, i: number) => ({
              sermonId: id,
              type: m.type,
              url: m.url,
              label: m.label || null,
              description: m.description || null,
              sequence: i,
            })),
          });
        }
      } catch (mediaErr: any) {
        console.error("[sermons PATCH] media replace failed:", mediaErr?.message);
      }
    }

    let sermon: any;
    try {
      sermon = await db.sermon.update({ where: { id }, data, include: WITH_SERIES_AND_MEDIA });
    } catch (updateErr: any) {
      console.error("[sermons PATCH] update with media include failed, retrying without:", updateErr?.message);
      sermon = await db.sermon.update({ where: { id }, data, include: WITH_SERIES_ONLY });
      sermon.media = [];
    }

    return NextResponse.json({ sermon: toDTO(sermon) });
  } catch (err: any) {
    console.error("[sermons PATCH]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update sermon" }, { status: 500 });
  }
}

// ── DELETE /api/sermons?id=...

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await db.sermon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[sermons DELETE]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete sermon" }, { status: 500 });
  }
}
