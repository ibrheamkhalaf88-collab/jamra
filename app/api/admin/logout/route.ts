import { adminCookieHeader } from "../../_helpers";

export async function POST(request: Request) {
  return Response.json({ ok: true }, { headers: { "set-cookie": adminCookieHeader("", request, true), "cache-control": "no-store" } });
}
