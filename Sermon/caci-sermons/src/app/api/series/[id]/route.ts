import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const series = await db.sermonSeries.findUnique({
      where: { id },
      include: {
        sermons: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!series) {
      return NextResponse.json(
        { error: "Series not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ series });
  } catch (error) {
    console.error("Failed to fetch series:", error);
    return NextResponse.json(
      { error: "Failed to fetch series" },
      { status: 500 }
    );
  }
}
