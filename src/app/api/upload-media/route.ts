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
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

const ALLOWED_TYPES: Record<string, string> = {
  "audio/mpeg":       "mp3",
  "audio/mp4":        "m4a",
  "audio/x-m4a":     "m4a",
  "audio/wav":        "wav",
  "audio/wave":       "wav",
  "audio/ogg":        "ogg",
  "audio/aac":        "aac",
  "video/mp4":        "mp4",
  "video/webm":       "webm",
  "video/ogg":        "ogv",
  "video/quicktime":  "mov",
  "application/pdf":  "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// 200 MB limit for media files
const MAX_BYTES = 200 * 1024 * 1024;

/**
 * POST /api/upload-media
 * Body: FormData with:
 *   - "file"   — the media file (audio/video/PDF/doc)
 *   - "folder" — optional subfolder prefix (default: "sermon-media")
 * Returns: { url, type, fileName, fileSize }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string | null) ?? "sermon-media";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported. Use MP3, M4A, WAV, MP4, or PDF.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be under 200 MB." }, { status: 400 });
    }

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

    const url = `${R2_PUBLIC_URL}/${key}`;

    // Derive media type category for the frontend
    let mediaType: "audio" | "video" | "document" = "document";
    if (file.type.startsWith("audio/")) mediaType = "audio";
    else if (file.type.startsWith("video/")) mediaType = "video";

    return NextResponse.json(
      { url, type: mediaType, fileName: file.name, fileSize: file.size },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[upload-media POST]", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
