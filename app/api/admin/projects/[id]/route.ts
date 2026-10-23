import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { projects } from "../../../../../db/schema";
import { cleanText, jsonError, requireAdmin, safeHttpUrl } from "../../../../api/_helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return jsonError("البيانات غير صالحة.");
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if ("title" in payload) { const title = cleanText(payload.title, 100); if (!title) return jsonError("اكتب اسم المشروع."); update.title = title; }
  if ("category" in payload) { const category = cleanText(payload.category, 30); if (!["website", "app", "video", "design", "campaign"].includes(category)) return jsonError("اختر نوع المشروع."); update.category = category; }
  if ("summary" in payload) update.summary = cleanText(payload.summary, 240);
  if ("description" in payload) update.description = cleanText(payload.description, 2400);
  if ("projectUrl" in payload) update.projectUrl = safeHttpUrl(payload.projectUrl);
  if ("coverKey" in payload) update.coverKey = cleanText(payload.coverKey, 240);
  if ("videoUrl" in payload) update.videoUrl = safeHttpUrl(payload.videoUrl);
  if ("gallery" in payload) {
    if (!Array.isArray(payload.gallery) || payload.gallery.length > 8) return jsonError("أقصى عدد لصور المشروع هو 8 صور.");
    const gallery = payload.gallery.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object").filter((item) => typeof item.key === "string" && item.key.startsWith("portfolio/"))
      .map((item) => ({ key: String(item.key).slice(0, 240), alt: cleanText(item.alt, 140) || "لقطة من المشروع" }));
    update.galleryJson = JSON.stringify(gallery);
  }
  if ("features" in payload) {
    const values = Array.isArray(payload.features) ? payload.features : [];
    update.featuresJson = JSON.stringify(values.map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 12));
  }
  if ("published" in payload) update.published = payload.published === false ? 0 : 1;
  await getDb().update(projects).set(update).where(eq(projects.id, id));
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const [project] = await getDb().select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return jsonError("المشروع غير موجود.", 404);
  await getDb().update(projects).set({ published: 0, updatedAt: new Date().toISOString() }).where(eq(projects.id, id));
  return Response.json({ ok: true });
}
