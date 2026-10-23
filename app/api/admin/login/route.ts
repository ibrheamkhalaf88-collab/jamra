import { env } from "cloudflare:workers";
import { adminCookieHeader, createAdminSession, jsonError, verifyAdminPassword } from "../../_helpers";

export async function POST(request: Request) {
  if (!env.DB) return jsonError("قاعدة البيانات غير متصلة.", 503);
  if (!env.JAMRA_ADMIN_EMAIL || !env.JAMRA_ADMIN_PASSWORD_HASH || !env.JAMRA_SESSION_SECRET) {
    return jsonError("تسجيل الدخول بكلمة مرور غير مهيأ لهذا الموقع.", 503);
  }
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== new URL(request.url).origin) return jsonError("الطلب غير مسموح.", 403);
  const address = request.headers.get("cf-connecting-ip") ?? "";
  if (!address) return jsonError("تعذّر التحقق من الاتصال.", 503);
  const ipDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${env.JAMRA_SESSION_SECRET}:${address}`));
  const ipHash = [...new Uint8Array(ipDigest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - 15 * 60;
  const attempt = await env.DB.prepare(`INSERT INTO jamra_admin_attempts (ip_hash, attempts, window_started) VALUES (?1, 1, ?2)
    ON CONFLICT(ip_hash) DO UPDATE SET
      attempts = CASE WHEN window_started < ?3 THEN 1 ELSE attempts + 1 END,
      window_started = CASE WHEN window_started < ?3 THEN ?2 ELSE window_started END
    RETURNING attempts`).bind(ipHash, now, cutoff).first<{ attempts: number }>("attempts");
  if ((attempt?.attempts ?? 0) > 8) return jsonError("محاولات كثيرة. جرّب تسجيل الدخول بعد 15 دقيقة.", 429);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const password = typeof payload?.password === "string" ? payload.password : "";
  if (password.length < 1 || password.length > 512 || !(await verifyAdminPassword(password))) {
    return jsonError("كلمة المرور غير صحيحة.", 401);
  }
  const cookie = await createAdminSession(env.JAMRA_ADMIN_EMAIL.trim().toLowerCase());
  return Response.json({ ok: true }, { headers: { "set-cookie": adminCookieHeader(cookie, request), "cache-control": "no-store" } });
}
