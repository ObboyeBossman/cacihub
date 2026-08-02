import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  // Opt in to surfacing suspended accounts so the client can render the
  // dedicated "Account Suspended" screen instead of silently bouncing to login.
  const session = await getSession({ includeSuspended: true });
  if (!session) {
    return NextResponse.json({ user: null, suspended: false }, { status: 200 });
  }
  if (session.isSuspended) {
    // Return the identity (for a personalised message) but no usable session.
    return NextResponse.json(
      { user: null, suspended: true, suspendedName: session.fullName },
      { status: 200 },
    );
  }
  return NextResponse.json({ user: session, suspended: false });
}
