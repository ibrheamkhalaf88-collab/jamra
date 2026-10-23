declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    JAMRA_ADMIN_EMAIL?: string;
    JAMRA_ADMIN_PASSWORD_HASH?: string;
    JAMRA_SESSION_SECRET?: string;
  }
}
