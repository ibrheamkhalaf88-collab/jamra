import { env } from "cloudflare:workers";
import { jsonError, requireAdmin } from "../../../api/_helpers";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm",
};
const maxBytes = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  if (!env.BUCKET) return jsonError("مساحة رفع الملفات غير مهيّأة.", 503);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("اختر صورة أو فيديو أولًا.");
  const extension = allowedTypes[file.type];
  if (!extension) return jsonError("الأنواع المدعومة: JPG وPNG وWebP وGIF وMP4 وWebM.");
  if (file.size < 1 || file.size > maxBytes) return jsonError("حجم الملف لازم يكون أقل من 25 ميغابايت.");
  const key = `portfolio/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return Response.json({ key, url: `/api/media?key=${encodeURIComponent(key)}`, type: file.type }, { status: 201 });
}
