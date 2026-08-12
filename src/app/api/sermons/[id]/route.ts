import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const raw = await db.sermon.findUnique({
      where: { id },
      include: {
        series: true,
        media: { orderBy: { sequence: "asc" } },
      },
    });

    if (!raw) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    // Fetch siblings for prev/next navigation
    const rawSiblings = await db.sermon.findMany({
      where: { seriesId: raw.seriesId },
      select: {
        id: true,
        title: true,
        theme: true,
        scriptureReference: true,
        sequence: true,
        date: true,
        speaker: true,
        speakerRole: true,
        durationSeconds: true,
        summary: true,
      },
      orderBy: { sequence: "asc" },
    });

    const mapSibling = (m: typeof rawSiblings[0]) => ({
      id: m.id,
      title: m.title,
      theme: m.theme ?? "",
      scripture: m.scriptureReference ?? "",
      sequence: m.sequence,
      datePreached: m.date instanceof Date ? m.date.toISOString() : String(m.date),
      preacher: m.speaker,
      speakerRole: m.speakerRole ?? null,
      duration: m.durationSeconds ?? null,
      summary: m.summary ?? null,
    });

    const siblings = rawSiblings.map(mapSibling);
    const idx = siblings.findIndex((s) => s.id === id);
    const prev = idx > 0 ? siblings[idx - 1] : null;
    const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

    // Map sermon to standalone shape
    const sermon = {
      id: raw.id,
      title: raw.title,
      theme: raw.theme ?? "",
      scripture: raw.scriptureReference ?? "",
      sequence: raw.sequence,
      datePreached: raw.date instanceof Date ? raw.date.toISOString() : String(raw.date),
      preacher: raw.speaker,
      speakerRole: raw.speakerRole ?? null,
      duration: raw.durationSeconds ?? null,
      summary: raw.summary ?? null,
      seriesId: raw.seriesId ?? "",
      description: raw.description ?? "",
      keyTakeaways: Array.isArray(raw.keyTakeaways) ? raw.keyTakeaways : [],
      quotations: typeof raw.quotations === "string"
        ? raw.quotations
        : JSON.stringify(raw.quotations ?? []),
      media: (raw.media ?? []).map((m) => ({
        id: m.id,
        sermonId: m.sermonId,
        type: m.type,
        url: m.url,
        label: m.label ?? null,
        sequence: m.sequence,
      })),
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
      // Attach series in the standalone's expected shape
      series: raw.series
        ? {
            id: raw.series.id,
            title: raw.series.title,
            description: raw.series.description ?? "",
            theme: raw.series.theme ?? "",
            anchorText: raw.series.anchorText,
            coverImage: raw.series.coverImage,
            year: raw.series.year,
            status: raw.series.status,
            startDate: raw.series.startDate instanceof Date
              ? raw.series.startDate.toISOString()
              : raw.series.startDate,
            endDate: raw.series.endDate instanceof Date
              ? raw.series.endDate.toISOString()
              : raw.series.endDate,
            createdAt: raw.series.createdAt.toISOString(),
            updatedAt: raw.series.updatedAt.toISOString(),
            sermons: siblings,
            sermonCount: siblings.length,
            latestSermon: siblings.length > 0 ? siblings[siblings.length - 1] : null,
          }
        : null,
    };

    return NextResponse.json({ sermon, siblings, prev, next });
  } catch (error) {
    console.error("Failed to fetch sermon:", error);
    return NextResponse.json({ error: "Failed to fetch sermon" }, { status: 500 });
  }
}
