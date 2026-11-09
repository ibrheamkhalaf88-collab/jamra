import { env } from "cloudflare:workers";

const RANGE_PATTERN = /^bytes=(\d*)-(\d*)$/;

type R2Object = NonNullable<Awaited<ReturnType<NonNullable<typeof env.BUCKET>["head"]>>>;

function parseRange(header: string, size: number): { offset: number; length: number } | "invalid" {
  const match = RANGE_PATTERN.exec(header.trim());
  if (!match) return "invalid";
  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return "invalid";

  if (!rawStart) {
    // Suffix range: bytes=-N (last N bytes)
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return "invalid";
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }

  const start = Number(rawStart);
  if (!Number.isFinite(start) || start >= size) return "invalid";
  const end = rawEnd ? Number(rawEnd) : size - 1;
  if (!Number.isFinite(end) || end < start) return "invalid";
  return { offset: start, length: Math.min(end, size - 1) - start + 1 };
}

function baseHeaders(object: R2Object): Headers {
  const headers = new Headers({
    "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "accept-ranges": "bytes",
    "x-content-type-options": "nosniff",
  });
  if (object.httpEtag) headers.set("etag", object.httpEtag);
  return headers;
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!key || key.length > 300 || key.includes("..") || !key.startsWith("portfolio/")) return new Response("Not found", { status: 404 });
  if (!env.BUCKET) return new Response("Media unavailable", { status: 503 });

  const head = await env.BUCKET.head(key);
  if (!head) return new Response("Not found", { status: 404 });

  const headers = baseHeaders(head);
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && head.httpEtag && ifNoneMatch.split(",").some((value) => value.trim() === head.httpEtag)) {
    return new Response(null, { status: 304, headers });
  }

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) {
    const object = await env.BUCKET.get(key);
    if (!object) return new Response("Not found", { status: 404 });
    headers.set("content-length", String(object.size));
    return new Response(object.body, { headers });
  }

  const range = parseRange(rangeHeader, head.size);
  if (range === "invalid") {
    const failed = new Headers(headers);
    failed.set("content-range", `bytes */${head.size}`);
    return new Response("Range not satisfiable", { status: 416, headers: failed });
  }

  const object = await env.BUCKET.get(key, { range: { offset: range.offset, length: range.length } });
  if (!object) return new Response("Not found", { status: 404 });

  const partial = new Headers(headers);
  partial.set("content-range", `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`);
  partial.set("content-length", String(range.length));
  return new Response(object.body, { status: 206, headers: partial });
}
