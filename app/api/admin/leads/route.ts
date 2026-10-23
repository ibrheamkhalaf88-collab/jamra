import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { inquiries } from "../../../../db/schema";
import { requireAdmin } from "../../../api/_helpers";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  const rows = await getDb().select({ id: inquiries.id, name: inquiries.name, contact: inquiries.contact, contactMethod: inquiries.contactMethod, source: inquiries.source, goal: inquiries.goal, service: inquiries.service, status: inquiries.status, createdAt: inquiries.createdAt, updatedAt: inquiries.updatedAt })
    .from(inquiries).orderBy(desc(inquiries.updatedAt)).limit(100);
  return Response.json({ leads: rows });
}
