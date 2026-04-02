import { createServiceRoleClient, createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

// Magic byte signatures for each allowed MIME type
// Each entry: [offset, bytes[]]
const MAGIC_SIGNATURES = [
  { mime: "image/jpeg",  offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png",   offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/gif",   offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  // WebP: "RIFF" at 0, "WEBP" at 8
  { mime: "image/webp",  offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
];

/**
 * Reads the first 12 bytes of an ArrayBuffer and returns the detected MIME type,
 * or null if no known signature matches.
 */
function detectMimeFromBytes(buffer) {
  const bytes = new Uint8Array(buffer);

  for (const sig of MAGIC_SIGNATURES) {
    const slice = bytes.slice(sig.offset, sig.offset + sig.bytes.length);
    if (sig.bytes.every((b, i) => slice[i] === b)) {
      // Extra check for WebP: bytes 8-11 must be "WEBP"
      if (sig.mime === "image/webp") {
        const webp = bytes.slice(8, 12);
        const expected = [0x57, 0x45, 0x42, 0x50];
        if (!expected.every((b, i) => webp[i] === b)) continue;
      }
      return sig.mime;
    }
  }
  return null;
}

/**
 * POST /api/upload
 * Body: multipart/form-data with field "file"
 *
 * Validates: MIME type (allow-list), file size (≤5MB), magic bytes.
 * Uploads to Supabase Storage bucket "feedback-images".
 * Returns: { url: string }
 */
export async function POST(request) {
  // Auth check: must be logged in (guests allowed per app design, but must have a valid session or null user_id)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Allow guests (user may be null per CLAUDE.md guest data policy)

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }

  // --- Size check ---
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "파일 크기는 5MB 이하여야 합니다" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "빈 파일은 업로드할 수 없습니다" }, { status: 400 });
  }

  // --- MIME type check (Content-Type header) ---
  const declaredMime = file.type?.toLowerCase() ?? "";
  if (!ALLOWED_MIME_TYPES.has(declaredMime)) {
    return NextResponse.json(
      { error: "이미지 파일만 업로드 가능합니다 (JPEG, PNG, GIF, WebP)" },
      { status: 400 }
    );
  }

  // --- Magic bytes check (read first 12 bytes) ---
  const headerBuffer = await file.slice(0, 12).arrayBuffer();
  const detectedMime = detectMimeFromBytes(headerBuffer);

  if (!detectedMime) {
    return NextResponse.json(
      { error: "파일 형식이 올바르지 않습니다" },
      { status: 400 }
    );
  }

  // Declared MIME must match detected MIME (prevent MIME spoofing)
  if (detectedMime !== declaredMime) {
    return NextResponse.json(
      { error: "파일 형식이 일치하지 않습니다" },
      { status: 400 }
    );
  }

  // --- Upload to Supabase Storage via service role ---
  const serviceClient = createServiceRoleClient();

  const ext = declaredMime.split("/")[1]; // jpeg / png / gif / webp
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  const userId = user?.id ?? "guest";
  const path = `${userId}/${timestamp}_${random}.${ext}`;

  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await serviceClient.storage
    .from("feedback-images")
    .upload(path, fileBuffer, {
      contentType: declaredMime,
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload] Storage upload failed:", uploadError.message);
    return NextResponse.json({ error: "업로드에 실패했습니다" }, { status: 500 });
  }

  const { data: urlData } = serviceClient.storage
    .from("feedback-images")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
}
