import { env } from "cloudflare:workers";
import { jsonError, requireAdmin } from "../../../api/_helpers";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm",
};
const maxBytes = 100 * 1024 * 1024; // 100MB - Cloudflare Workers max request body

function sniffType(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length >= 12 && ascii(4, 8) === "ftyp") return "video/mp4";
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (bytes.length >= 6 && ascii(0, 3) === "GIF") return "image/gif";
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  if (!env.BUCKET) return jsonError("مساحة رفع الملفات غير مهيّأة.", 503);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("اختر صورة أو فيديو أولًا.");
  const extension = allowedTypes[file.type];
  if (!extension) return jsonError("الأنواع المدعومة: JPG وPNG وWebP وGIF وMP4 وWebM.");
  if (file.size < 1 || file.size > maxBytes) return jsonError(`حجم الملف لازم يكون أقل من ${maxBytes / 1024 / 1024} ميغابايت.`);
  const buffer = await file.arrayBuffer();
  // Never trust the client-declared MIME type: verify the actual file signature.
  const sniffed = sniffType(new Uint8Array(buffer.slice(0, 16)));
  if (sniffed !== file.type) return jsonError("محتوى الملف لا يطابق نوعه. ارفع صورة أو فيديو صالح.");
  const key = `portfolio/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, buffer, { httpMetadata: { contentType: file.type } });
  return Response.json({ key, url: `/api/media?key=${encodeURIComponent(key)}`, type: file.type }, { status: 201 });
}
