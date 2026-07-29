import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sermon = await db.sermon.findUnique({
      where: { id },
      include: {
        series: true,
      },
    });

    if (!sermon) {
      return NextResponse.json(
        { error: "Sermon not found" },
        { status: 404 }
      );
    }

    // Also fetch sibling sermons for navigation
    const siblings = await db.sermon.findMany({
      where: { seriesId: sermon.seriesId },
      select: {
        id: true,
        title: true,
        sequence: true,
        theme: true,
        scripture: true,
        datePreached: true,
      },
      orderBy: { sequence: "asc" },
    });

    const idx = siblings.findIndex((s) => s.id === sermon.id);
    const prev = idx > 0 ? siblings[idx - 1] : null;
    const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

    return NextResponse.json({
      sermon,
      siblings,
      prev,
      next,
    });
  } catch (error) {
    console.error("Failed to fetch sermon:", error);
    return NextResponse.json(
      { error: "Failed to fetch sermon" },
      { status: 500 }
    );
  }
}
