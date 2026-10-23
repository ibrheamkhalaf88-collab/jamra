import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { projects } from "../../../../db/schema";
import { cleanText, jsonError, requireAdmin, safeHttpUrl } from "../../../api/_helpers";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  const rows = await getDb().select().from(projects).orderBy(desc(projects.createdAt)).limit(200);
  return Response.json({ projects: rows.map(({ coverKey, galleryJson, featuresJson, ...project }) => ({
    ...project, coverKey, galleryJson, featuresJson,
    coverUrl: coverKey ? `/api/media?key=${encodeURIComponent(coverKey)}` : "",
    gallery: parseGallery(galleryJson), features: parseList(featuresJson),
  })) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return jsonError("البيانات غير صالحة.");
  const title = cleanText(payload.title, 100);
  const category = cleanText(payload.category, 30);
  if (!title || !["website", "app", "video", "design", "campaign"].includes(category)) return jsonError("أدخل اسم المشروع واختر نوعه.");
  const gallery = cleanGallery(payload.gallery);
  if (gallery === null) return jsonError("أقصى عدد لصور المشروع هو 8 صور.");
  const features = cleanList(payload.features);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await getDb().insert(projects).values({
    id, title, category,
    summary: cleanText(payload.summary, 240),
    description: cleanText(payload.description, 2400),
    projectUrl: safeHttpUrl(payload.projectUrl),
    coverKey: cleanText(payload.coverKey, 240),
    videoUrl: safeHttpUrl(payload.videoUrl),
    galleryJson: JSON.stringify(gallery),
    featuresJson: JSON.stringify(features),
    published: payload.published === false ? 0 : 1,
    createdAt: now, updatedAt: now,
  });
  return Response.json({ id }, { status: 201 });
}

function cleanGallery(value: unknown): { key: string; alt: string }[] | null {
  if (!Array.isArray(value)) return [];
  const items = value.slice(0, 9).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  if (items.length > 8) return null;
  return items.filter((item) => typeof item.key === "string" && item.key.startsWith("portfolio/")).map((item) => ({ key: String(item.key).slice(0, 240), alt: cleanText(item.alt, 140) || "لقطة من المشروع" }));
}
function cleanList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 12);
  if (typeof value === "string") return value.split(/\r?\n/).map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 12);
  return [];
}
function parseList(value: string) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 12) : []; } catch { return []; } }
function parseGallery(value: string) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.key === "string").slice(0, 8).map((item) => ({ key: item.key, url: `/api/media?key=${encodeURIComponent(item.key)}`, alt: String(item.alt || "لقطة من المشروع") })) : []; } catch { return []; } }
