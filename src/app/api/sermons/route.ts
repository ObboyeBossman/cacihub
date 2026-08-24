import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { SermonDTO } from "@/lib/types";

export const runtime = "nodejs";

function toDTO(s: any): SermonDTO {
  return {
    id: s.id,
    sequence: s.sequence,
    title: s.title,
    speaker: s.speaker,
    speakerRole: s.speakerRole ?? null,
    date: s.date.toISOString(),
    summary: s.summary ?? null,
    description: s.description,
    theme: s.theme,
    scriptureReference: s.scriptureReference,
    keyTakeaways: Array.isArray(s.keyTakeaways) ? s.keyTakeaways : [],
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

const WITH_MEDIA = {
  media: { orderBy: { sequence: "asc" as const } },
};

// ── Resilient read helpers (graceful fallback if sermon_media isn't yet
//    visible to this Prisma client build — avoids 500 on cold-start race)

async function findSermonWithMedia(where: any): Promise<any> {
  return db.sermon.findUnique({ where, include: WITH_MEDIA });
}

async function findSermonsWithMedia(orderBy: any): Promise<any[]> {
  return db.sermon.findMany({ orderBy, take: 200, include: WITH_MEDIA });
}

// ── GET /api/sermons

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const sermon = await findSermonWithMedia({ id });
      if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ sermon: toDTO(sermon) });
    }

    const sermons = await findSermonsWithMedia([{ date: "desc" as const }, { sequence: "asc" as const }]);
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
      title, speaker, speakerRole, date, summary, description, theme, scriptureReference,
      keyTakeaways, quotations, media, coverImageUrl, durationSeconds, sequence,
    } = body;

    if (!title?.trim() || !speaker?.trim() || !date) {
      return NextResponse.json({ error: "Title, speaker, and date are required." }, { status: 400 });
    }

    const ALLOWED_MEDIA_TYPES = new Set(["video", "audio", "pdf", "text"]);
    const normalisedMedia = Array.isArray(media)
      ? media
          .filter((m: any) => m?.url && ALLOWED_MEDIA_TYPES.has(m.type))
          // Keep only the first occurrence of each type
          .filter(
            (m: any, _i: number, arr: any[]) =>
              arr.findIndex((x) => x.type === m.type) === arr.indexOf(m)
          )
      : [];

    const seq = Number(sequence) || 1;

    const sermonData = {
      title: title.trim(),
      speaker: speaker.trim(),
      speakerRole: speakerRole?.trim() || null,
      date: new Date(date),
      summary: summary?.trim() || null,
      description: description || null,
      theme: theme || null,
      scriptureReference: scriptureReference || null,
      keyTakeaways: Array.isArray(keyTakeaways) ? keyTakeaways : [],
      quotations: Array.isArray(quotations) ? quotations : [],
      coverImageUrl: coverImageUrl || null,
      durationSeconds: durationSeconds ? Number(durationSeconds) : null,
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
          media: normalisedMedia.length > 0
            ? {
                create: normalisedMedia.map((m: any, i: number) => ({
                  type: m.type,
                  url: m.url,
                  label: m.label || null,
                  description: m.description || null,
                  sequence: i,
                })),
              }
            : undefined,
        },
        include: WITH_MEDIA,
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
        include: {},
      });
      sermon.media = [];

      // Now try inserting media rows separately
      if (normalisedMedia.length > 0) {
        try {
          await db.sermonMedia.createMany({
            data: normalisedMedia.map((m: any, i: number) => ({
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
            include: WITH_MEDIA,
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
        await db.notification.createMany({
          data: activeMembers.map((m: any) => ({
            memberId: m.id,
            type: "sermon",
            referenceId: sermon.id,
            title: "New Sermon Available",
            body: `${sermon.title} by ${sermon.speaker}`,
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
    for (const f of ["title", "speaker", "speakerRole", "summary", "description", "theme", "scriptureReference", "coverImageUrl"]) {
      if (updates[f] !== undefined) data[f] = updates[f] || null;
    }
    if (updates.title) data.title = updates.title.trim();
    if (updates.speaker) data.speaker = updates.speaker.trim();
    if (updates.speakerRole !== undefined) data.speakerRole = updates.speakerRole?.trim() || null;
    if (updates.summary !== undefined) data.summary = updates.summary?.trim() || null;
    if (updates.date) data.date = new Date(updates.date);
    if (updates.keyTakeaways !== undefined) data.keyTakeaways = Array.isArray(updates.keyTakeaways) ? updates.keyTakeaways : [];
    if (updates.quotations !== undefined) data.quotations = Array.isArray(updates.quotations) ? updates.quotations : [];
    if (updates.durationSeconds !== undefined) data.durationSeconds = updates.durationSeconds ? Number(updates.durationSeconds) : null;
    if (updates.sequence !== undefined) data.sequence = Number(updates.sequence);

    // Replace all media if provided — enforce one of each allowed type
    if (Array.isArray(media)) {
      const ALLOWED_MEDIA_TYPES = new Set(["video", "audio", "pdf", "text"]);
      const normalisedMedia = media
        .filter((m: any) => m?.url && ALLOWED_MEDIA_TYPES.has(m.type))
        .filter(
          (m: any, _i: number, arr: any[]) =>
            arr.findIndex((x) => x.type === m.type) === arr.indexOf(m)
        );

      try {
        await db.sermonMedia.deleteMany({ where: { sermonId: id } });
        if (normalisedMedia.length > 0) {
          await db.sermonMedia.createMany({
            data: normalisedMedia.map((m: any, i: number) => ({
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
      sermon = await db.sermon.update({ where: { id }, data, include: WITH_MEDIA });
    } catch (updateErr: any) {
      console.error("[sermons PATCH] update with media include failed, retrying without:", updateErr?.message);
      sermon = await db.sermon.update({ where: { id }, data });
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
