import { and, count, eq, gt } from "drizzle-orm";
import { getDb } from "../../../db";
import { inquiryMessages, inquiries } from "../../../db/schema";
import { cleanText, hashText, jsonError, randomToken } from "../_helpers";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return jsonError("ما قدرنا نقرأ التفاصيل اللي أرسلتها.");
  if (cleanText(payload.website, 200)) return Response.json({ accepted: true });
  const name = cleanText(payload.name, 90);
  const contact = cleanText(payload.contact, 160);
  const contactMethod = cleanText(payload.contactMethod, 20);
  const source = cleanText(payload.source, 80);
  const goal = cleanText(payload.goal, 2000);
  const service = cleanText(payload.service, 50);
  if (name.length < 2 || contact.length < 5 || goal.length < 8 || !service) return jsonError("كمّل الاسم وطريقة التواصل والفكرة والخدمة المطلوبة.");
  if (!["whatsapp", "phone", "email", "zoom", "site"].includes(contactMethod)) return jsonError("اختر طريقة التواصل المناسبة.");

  const db = getDb();
  const now = new Date().toISOString();
  const ip = request.headers.get("cf-connecting-ip") ?? "";
  const ipHash = ip ? await hashText(ip) : "";
  if (ipHash) {
    const recent = await db.select({ total: count() }).from(inquiries).where(and(eq(inquiries.ipHash, ipHash), gt(inquiries.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())));
    if ((recent[0]?.total ?? 0) >= 4) return jsonError("وصلنا أكثر من طلب من هذا الاتصال اليوم. تواصل معنا عبر المحادثة المفتوحة أو جرّب بكرة.", 429);
  }

  const id = crypto.randomUUID();
  const token = randomToken();
  await db.insert(inquiries).values({
    id, accessHash: await hashText(token), name, contact, contactMethod,
    source, goal, service, status: "new", ipHash, createdAt: now, updatedAt: now,
  });
  await db.insert(inquiryMessages).values({
    id: crypto.randomUUID(), inquiryId: id, author: "client",
    body: goal.slice(0, 2200), createdAt: now,
  });
  return Response.json({ accepted: true, ticket: id, token }, { status: 201 });
}
