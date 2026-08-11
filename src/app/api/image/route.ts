import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

/**
 * GET /api/image?key=<r2-object-key>
 *
 * Proxies an R2 object to the browser without requiring public bucket access.
 * The key must begin with an allowed prefix to prevent open-proxy abuse.
 */
const ALLOWED_PREFIXES = [
  "series-covers/",
  "sermon-covers/",
  "sermon-media/",
  "profile-photos/",
  "uploads/",
  "sermons/",
];

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key) {
    return new NextResponse("Missing key", { status: 400 });
  }

  // Guard: only serve from known folders to prevent open-proxy abuse
  const allowed = ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));
  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const obj = await r2.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );

    if (!obj.Body) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Stream the R2 body directly to the response
    const contentType = obj.ContentType ?? "application/octet-stream";
    const contentLength = obj.ContentLength;

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      // Cache for 1 year in browser and CDN — images are immutable (keyed by timestamp)
      "Cache-Control": "public, max-age=31536000, immutable",
    };
    if (contentLength != null) {
      headers["Content-Length"] = String(contentLength);
    }

    const body = obj.Body as ReadableStream;
    return new NextResponse(body, { status: 200, headers });
  } catch (err: any) {
    if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
      return new NextResponse("Not found", { status: 404 });
    }
    console.error("[image GET]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
