import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET        = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

// Maps MIME type → file extension
const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg":       "mp3",
  "audio/mp4":        "m4a",
  "audio/x-m4a":      "m4a",
  "audio/wav":        "wav",
  "audio/wave":       "wav",
  "audio/ogg":        "ogg",
  "audio/aac":        "aac",
  "audio/flac":       "flac",
  "video/mp4":        "mp4",
  "video/webm":       "webm",
  "video/ogg":        "ogv",
  "video/quicktime":  "mov",
  "video/x-msvideo":  "avi",
  "video/x-matroska": "mkv",
  "image/jpeg":       "jpg",
  "image/png":        "png",
  "image/gif":        "gif",
  "image/webp":       "webp",
  "image/svg+xml":    "svg",
  "image/heic":       "heic",
  "image/heif":       "heif",
  "application/pdf":  "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.apple.keynote": "key",
};

function deriveMediaType(mime: string): "audio" {
  return "audio";
}

/**
 * POST /api/presign-upload
 * Body: JSON { fileName, contentType, folder?, fileSize }
 * Returns: { uploadUrl, publicUrl, type }
 *
 * The client PUTs the file directly to R2 using uploadUrl.
 * This bypasses Vercel's 4.5 MB body limit entirely.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session)                    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin")    return NextResponse.json({ error: "Forbidden" },      { status: 403 });

    const body        = await req.json();
    const fileName    = (body.fileName    as string | undefined) ?? "";
    const contentType = (body.contentType as string | undefined) ?? "application/octet-stream";
    const folder      = (body.folder      as string | undefined) ?? "sermon-media";
    const fileSize    = (body.fileSize    as number | undefined) ?? 0;

    if (!fileName) return NextResponse.json({ error: "fileName is required." }, { status: 400 });

    if (!contentType.startsWith("audio/") && contentType !== "application/octet-stream") {
      return NextResponse.json(
        { error: "Only audio files (MP3, M4A, WAV, AAC, OGG, FLAC) are allowed for sermons." },
        { status: 400 }
      );
    }

    // 500 MB hard cap checked server-side even though the upload goes direct to R2
    const MAX_BYTES = 500 * 1024 * 1024;
    if (fileSize > MAX_BYTES) {
      return NextResponse.json({ error: "File must be under 500 MB." }, { status: 400 });
    }

    const ext =
      MIME_TO_EXT[contentType] ??
      (fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "bin");

    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      ContentType: contentType,
    });

    // Presigned URL valid for 15 minutes — plenty for large uploads
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : `/api/image?key=${encodeURIComponent(key)}`;

    return NextResponse.json(
      { uploadUrl, publicUrl, type: deriveMediaType(contentType) },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[presign-upload POST]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
