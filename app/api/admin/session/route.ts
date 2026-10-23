import { env } from "cloudflare:workers";
import { chatGPTSignInPath, getChatGPTUser } from "../../../chatgpt-auth";
import { adminUser } from "../../_helpers";

export async function GET(request: Request) {
  const admin = await adminUser(request);
  if (admin) return Response.json({ signedIn: true, allowed: true, name: admin.displayName, authMode: admin.userId === "jamra-admin" ? "password" : "chatgpt" });
  const user = await getChatGPTUser();
  if (user) return Response.json({ signedIn: true, allowed: false }, { status: 403 });
  if (env.JAMRA_ADMIN_PASSWORD_HASH && env.JAMRA_SESSION_SECRET) {
    return Response.json({ signedIn: false, signInUrl: "/admin-login.html", authMode: "password" });
  }
  return Response.json({ signedIn: false, signInUrl: chatGPTSignInPath("/admin.html"), authMode: "chatgpt" });
}
