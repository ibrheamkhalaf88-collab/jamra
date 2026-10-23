import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const response = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    // Ensure UTF-8 charset for HTML/text responses (fixes Arabic mojibake in some clients)
    const contentType = response.headers.get("content-type") || "";
    let finalContentType = contentType;
    if (!contentType) {
      // vinext static-file responses may lack Content-Type when served via run_worker_first
      const path = new URL(request.url).pathname.toLowerCase();
      if (path.endsWith(".html") || path === "/" || path.endsWith("/")) finalContentType = "text/html; charset=utf-8";
      else if (path.endsWith(".css")) finalContentType = "text/css; charset=utf-8";
      else if (path.endsWith(".js")) finalContentType = "text/javascript; charset=utf-8";
      else if (path.endsWith(".json")) finalContentType = "application/json; charset=utf-8";
      else if (path.endsWith(".svg")) finalContentType = "image/svg+xml";
      else if (path.endsWith(".webp")) finalContentType = "image/webp";
      else if (path.endsWith(".png")) finalContentType = "image/png";
      else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) finalContentType = "image/jpeg";
      else if (path.endsWith(".mp4")) finalContentType = "video/mp4";
      else if (path.endsWith(".webm")) finalContentType = "video/webm";
    }
    if (finalContentType && finalContentType !== contentType) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("content-type", finalContentType);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }
    // Add charset to existing text responses that lack it
    if (contentType.startsWith("text/html") && !contentType.includes("charset")) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("content-type", "text/html; charset=utf-8");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }
    if (contentType.startsWith("text/css") && !contentType.includes("charset")) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("content-type", "text/css; charset=utf-8");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }
    if (contentType.startsWith("text/javascript") && !contentType.includes("charset")) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("content-type", "text/javascript; charset=utf-8");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }
    return response;
  },
};

export default worker;
