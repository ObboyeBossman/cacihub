import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSession } from "@/lib/auth";

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
// Images are served directly from the R2 public bucket URL.
// This works on every device without needing a server-side proxy.
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/upload
 * Body: FormData with field "file" (the image) and optional "folder" (e.g. "series-covers")
 * Returns: { url } — the public URL of the uploaded file
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string | null) ?? "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be under 5 MB." }, { status: 400 });
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ContentLength: buffer.byteLength,
      })
    );

    // Return the direct public R2 URL — works on every device, no proxy needed
    const url = `${R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url }, { status: 200 });
  } catch (err: any) {
    console.error("[upload POST]", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
