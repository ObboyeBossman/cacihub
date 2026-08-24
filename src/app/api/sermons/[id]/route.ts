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
      include: { media: { orderBy: { sequence: "asc" } } },
    });

    if (!raw) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

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
    };

    return NextResponse.json({ sermon });
  } catch (error) {
    console.error("Failed to fetch sermon:", error);
    return NextResponse.json({ error: "Failed to fetch sermon" }, { status: 500 });
  }
}
