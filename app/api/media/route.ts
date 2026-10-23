import { env } from "cloudflare:workers";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!key || key.length > 300 || key.includes("..") || !key.startsWith("portfolio/")) return new Response("Not found", { status: 404 });
  if (!env.BUCKET) return new Response("Media unavailable", { status: 503 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: {
    "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  } });
}
