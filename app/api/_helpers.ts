import { env } from "cloudflare:workers";
import { getChatGPTUser, chatGPTSignInPath } from "../chatgpt-auth";
import type { ChatGPTUser } from "../chatgpt-auth";

const encoder = new TextEncoder();
const ADMIN_COOKIE = "jamra_admin";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export async function adminUser(request: Request): Promise<ChatGPTUser | null> {
  const cookieEmail = await getAdminCookieEmail(request);
  if (cookieEmail) return { userId: "jamra-admin", displayName: "فريق جَمْرَة", email: cookieEmail, fullName: null };
  const user = await getChatGPTUser();
  const allowed = env.JAMRA_ADMIN_EMAIL?.trim().toLowerCase();
  if (!user || !allowed || user.email.trim().toLowerCase() !== allowed) return null;
  return user;
}

export async function requireAdmin(request: Request): Promise<{ user: ChatGPTUser } | { response: Response }> {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).origin !== new URL(request.url).origin) {
          return { response: Response.json({ error: "الطلب غير مسموح." }, { status: 403 }) };
        }
      } catch {
        return { response: Response.json({ error: "الطلب غير مسموح." }, { status: 403 }) };
      }
    }
  }
  const cookieEmail = await getAdminCookieEmail(request);
  if (cookieEmail) return { user: { userId: "jamra-admin", displayName: "فريق جَمْرَة", email: cookieEmail, fullName: null } };
  const user = await getChatGPTUser();
  if (!user) {
    const passwordMode = Boolean(env.JAMRA_ADMIN_PASSWORD_HASH && env.JAMRA_SESSION_SECRET);
    return { response: Response.json({ error: "sign_in_required", signInUrl: passwordMode ? "/admin-login.html" : chatGPTSignInPath("/admin.html") }, { status: 401 }) };
  }
  const allowed = env.JAMRA_ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowed || user.email.trim().toLowerCase() !== allowed) {
    return { response: Response.json({ error: "not_allowed" }, { status: 403 }) };
  }
  return { user };
}

export async function createAdminSession(email: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${email}|${expires}`;
  const signature = await signSession(payload);
  return `${payload}|${signature}`;
}

export function adminCookieHeader(value: string, request: Request, clear = false) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${clear ? "" : encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_SECONDS}${secure}`;
}

export async function verifyAdminPassword(password: string) {
  const stored = env.JAMRA_ADMIN_PASSWORD_HASH ?? "";
  const [scheme, iterationsText, saltText, expectedText] = stored.split("$");
  const iterations = Number(iterationsText);
  if (scheme !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100000 || !saltText || !expectedText) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: decodeBase64Url(saltText), iterations }, key, 256));
  const expected = decodeBase64Url(expectedText);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}

async function getAdminCookieEmail(request: Request) {
  const allowed = env.JAMRA_ADMIN_EMAIL?.trim().toLowerCase();
  const secret = env.JAMRA_SESSION_SECRET;
  if (!allowed || !secret) return "";
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1);
  if (!value) return "";
  let decoded = "";
  try { decoded = decodeURIComponent(value); } catch { return ""; }
  const parts = decoded.split("|");
  if (parts.length !== 3) return "";
  const [email, expiresText, signature] = parts;
  const expires = Number(expiresText);
  if (email.toLowerCase() !== allowed || !Number.isInteger(expires) || expires <= Date.now() / 1000) return "";
  const expected = await signSession(`${email}|${expiresText}`);
  return constantTimeEqual(signature, expected) ? allowed : "";
}

async function signSession(payload: string) {
  const secret = env.JAMRA_SESSION_SECRET;
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encodeBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  } catch { return new Uint8Array(); }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function safeHttpUrl(value: unknown) {
  const input = cleanText(value, 1000);
  if (!input) return "";
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function hashText(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bearer(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}
