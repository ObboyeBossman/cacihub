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

// Maps MIME type → file extension for known types.
// Any MIME not listed here is still accepted — it falls back to the
// file's own extension, so the upload is never rejected on type alone.
const MIME_TO_EXT: Record<string, string> = {
  // Audio
  "audio/mpeg":       "mp3",
  "audio/mp4":        "m4a",
  "audio/x-m4a":      "m4a",
  "audio/wav":        "wav",
  "audio/wave":       "wav",
  "audio/ogg":        "ogg",
  "audio/aac":        "aac",
  "audio/flac":       "flac",
  // Video
  "video/mp4":        "mp4",
  "video/webm":       "webm",
  "video/ogg":        "ogv",
  "video/quicktime":  "mov",
  "video/x-msvideo":  "avi",
  "video/x-matroska": "mkv",
  // Images
  "image/jpeg":       "jpg",
  "image/png":        "png",
  "image/gif":        "gif",
  "image/webp":       "webp",
  "image/svg+xml":    "svg",
  "image/heic":       "heic",
  "image/heif":       "heif",
  // Documents
  "application/pdf":  "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  // Slides
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.apple.keynote": "key",
  // Spreadsheets (for financial/data attachments)
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

// Derive the frontend SermonMediaType category from MIME type
function deriveMediaType(mime: string): "audio" | "video" | "image" | "slides" | "document" {
  if (mime.startsWith("audio/"))  return "audio";
  if (mime.startsWith("video/"))  return "video";
  if (mime.startsWith("image/"))  return "image";
  if (
    mime === "application/vnd.ms-powerpoint" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mime === "application/vnd.apple.keynote"
  ) return "slides";
  return "document";
}

// 500 MB limit — generous for video files
const MAX_BYTES = 500 * 1024 * 1024;

/**
 * POST /api/upload-media
 * Body: FormData with:
 *   - "file"   — any media file (audio, video, image, PDF, slides, etc.)
 *   - "folder" — optional subfolder prefix (default: "sermon-media")
 * Returns: { url, type, fileName, fileSize }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const form   = await req.formData();
    const file   = form.get("file") as File | null;
    const folder = (form.get("folder") as string | null) ?? "sermon-media";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be under 500 MB." }, { status: 400 });
    }

    // Resolve extension: known MIME → mapped ext, otherwise pull from the filename
    const ext =
      MIME_TO_EXT[file.type] ??
      (file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin");

    const key    = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
        ContentLength: buffer.byteLength,
      })
    );

    const url       = `${R2_PUBLIC_URL}/${key}`;
    const mediaType = deriveMediaType(file.type);

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
