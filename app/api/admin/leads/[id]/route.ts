import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { inquiryMessages, inquiries } from "../../../../../db/schema";
import { cleanText, jsonError, requireAdmin } from "../../../../api/_helpers";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const [inquiry] = await getDb().select({ id: inquiries.id, name: inquiries.name, contact: inquiries.contact, contactMethod: inquiries.contactMethod, source: inquiries.source, goal: inquiries.goal, service: inquiries.service, status: inquiries.status, createdAt: inquiries.createdAt })
    .from(inquiries).where(eq(inquiries.id, id)).limit(1);
  if (!inquiry) return jsonError("الطلب غير موجود.", 404);
  const messages = await getDb().select({ id: inquiryMessages.id, author: inquiryMessages.author, body: inquiryMessages.body, createdAt: inquiryMessages.createdAt })
    .from(inquiryMessages).where(eq(inquiryMessages.inquiryId, id)).orderBy(asc(inquiryMessages.createdAt)).limit(200);
  return Response.json({ inquiry, messages });
}

export async function POST(request: Request, { params }: Context) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const [inquiry] = await getDb().select({ id: inquiries.id }).from(inquiries).where(eq(inquiries.id, id)).limit(1);
  if (!inquiry) return jsonError("الطلب غير موجود.", 404);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const body = cleanText(payload?.message, 1200);
  if (!body) return jsonError("اكتب الرد أولًا.");
  const now = new Date().toISOString();
  await getDb().insert(inquiryMessages).values({ id: crypto.randomUUID(), inquiryId: id, author: "team", body, createdAt: now });
  await getDb().update(inquiries).set({ status: "waiting_client", updatedAt: now }).where(eq(inquiries.id, id));
  return Response.json({ ok: true });
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const status = cleanText(payload?.status, 30);
  if (!["new", "in_progress", "waiting_client", "closed"].includes(status)) return jsonError("حالة الطلب غير معروفة.");
  await getDb().update(inquiries).set({ status, updatedAt: new Date().toISOString() }).where(eq(inquiries.id, id));
  return Response.json({ ok: true });
}
