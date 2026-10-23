import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { projects } from "../../../db/schema";

export async function GET() {
  const rows = await getDb().select().from(projects).where(eq(projects.published, 1)).orderBy(asc(projects.createdAt));
  return Response.json({ projects: rows.map(({ coverKey, galleryJson, featuresJson, ...project }) => ({
    ...project,
    coverUrl: coverKey ? `/api/media?key=${encodeURIComponent(coverKey)}` : "",
    features: parseStringList(featuresJson),
    gallery: parseGallery(galleryJson),
  })) }, { headers: { "cache-control": "public, max-age=60" } });
}

function parseStringList(value: string) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 12) : []; } catch { return []; }
}

function parseGallery(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.key === "string" && item.key.startsWith("portfolio/")).slice(0, 8)
      .map((item) => ({ url: `/api/media?key=${encodeURIComponent(item.key)}`, alt: typeof item.alt === "string" ? item.alt.slice(0, 140) : "لقطة من المشروع" }));
  } catch { return []; }
}
