import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ministries = await db.ministry.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ ministries });
  } catch (error) {
    console.error("Failed to fetch ministries:", error);
    return NextResponse.json({ error: "Failed to fetch ministries" }, { status: 500 });
  }
}
