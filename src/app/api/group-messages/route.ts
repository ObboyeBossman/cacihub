import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Helper: detect "table does not exist" errors from Prisma/Postgres
function isTableMissingError(err: any): boolean {
  const msg: string = err?.message ?? "";
  return msg.includes("does not exist") || msg.includes("relation") || err?.code === "P2021";
}

// GET /api/group-messages?groupId=...
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });

  try {
    const messages = await db.groupMessage.findMany({
      where: { groupId },
      include: { member: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        memberId: m.memberId,
        memberName: m.member.fullName,
        memberTitle: m.member.title,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        isOwn: m.member.authUserId === session.id,
      })),
    });
  } catch (err) {
    if (isTableMissingError(err)) return NextResponse.json({ messages: [] });
    throw err;
  }
}

// POST /api/group-messages
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.memberId) return NextResponse.json({ error: "No linked member profile." }, { status: 400 });

  const body = await req.json();
  const { groupId, content } = body;
  if (!groupId || !content?.trim()) {
    return NextResponse.json({ error: "groupId and content are required." }, { status: 400 });
  }

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group || !group.isActive) {
    return NextResponse.json({ error: "Group not found or archived." }, { status: 404 });
  }

  const membership = await db.groupMember.findUnique({
    where: { groupId_memberId: { groupId, memberId: session.memberId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this group." }, { status: 403 });
  }

  if (group.messagingMode === "restricted" && session.role !== "admin" && group.leaderId !== session.memberId) {
    return NextResponse.json({ error: "This group is restricted. Only the leader can post." }, { status: 403 });
  }

  try {
    const msg = await db.groupMessage.create({
      data: { groupId, memberId: session.memberId, content: content.trim() },
      include: { member: true },
    });

    return NextResponse.json({
      message: {
        id: msg.id,
        groupId: msg.groupId,
        memberId: msg.memberId,
        memberName: msg.member.fullName,
        memberTitle: msg.member.title,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        isOwn: true,
      },
    }, { status: 201 });
  } catch (err) {
    if (isTableMissingError(err)) {
      return NextResponse.json({ error: "Group messaging is not yet available." }, { status: 503 });
    }
    throw err;
  }
}

// DELETE /api/group-messages?id=...
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    const msg = await db.groupMessage.findUnique({ where: { id } });
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isSender = msg.memberId === session.memberId;
    if (session.role !== "admin" && !isSender) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.groupMessage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isTableMissingError(err)) return NextResponse.json({ ok: true });
    throw err;
  }
}
