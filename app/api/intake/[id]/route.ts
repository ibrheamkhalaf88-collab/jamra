import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { inquiryMessages, inquiries } from "../../../../db/schema";
import { bearer, cleanText, hashText, jsonError } from "../../../api/_helpers";

type Context = { params: Promise<{ id: string }> };

async function verifiedInquiry(request: Request, id: string) {
  const token = bearer(request);
  if (!token || token.length < 30) return null;
  const [inquiry] = await getDb().select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  if (!inquiry) return null;
  const expected = inquiry.accessHash;
  const actual = await hashText(token);
  let mismatch = expected.length ^ actual.length;
  for (let i = 0; i < Math.max(expected.length, actual.length); i++) mismatch |= (expected.charCodeAt(i) || 0) ^ (actual.charCodeAt(i) || 0);
  return mismatch === 0 ? inquiry : null;
}

export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  const inquiry = await verifiedInquiry(request, id);
  if (!inquiry) return jsonError("رابط المحادثة غير صحيح أو انتهت صلاحيته.", 404);
  const messages = await getDb().select({ id: inquiryMessages.id, author: inquiryMessages.author, body: inquiryMessages.body, createdAt: inquiryMessages.createdAt })
    .from(inquiryMessages).where(eq(inquiryMessages.inquiryId, id)).orderBy(asc(inquiryMessages.createdAt)).limit(200);
  return Response.json({ inquiry: { id: inquiry.id, name: inquiry.name, service: inquiry.service, status: inquiry.status, createdAt: inquiry.createdAt }, messages });
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const inquiry = await verifiedInquiry(request, id);
  if (!inquiry) return jsonError("رابط المحادثة غير صحيح أو انتهت صلاحيته.", 404);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const body = cleanText(payload?.message, 1200);
  if (body.length < 1) return jsonError("اكتب رسالتك أولًا.");
  const now = new Date().toISOString();
  await getDb().insert(inquiryMessages).values({ id: crypto.randomUUID(), inquiryId: id, author: "client", body, createdAt: now });
  if (inquiry.status === "waiting_client") await getDb().update(inquiries).set({ status: "in_progress", updatedAt: now }).where(eq(inquiries.id, id));
  else await getDb().update(inquiries).set({ updatedAt: now }).where(eq(inquiries.id, id));
  return Response.json({ ok: true });
}
