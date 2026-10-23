import { pbkdf2Sync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";

const terminal = createInterface({ input: process.stdin, output: process.stdout });
try {
  const password = await terminal.question("كلمة مرور لوحة جَمْرَة (12 حرفًا على الأقل): ");
  const confirmation = await terminal.question("أعد كتابة كلمة المرور: ");
  if (password.length < 12 || password !== confirmation) {
    throw new Error("كلمة المرور يجب أن تكون 12 حرفًا على الأقل وأن تتطابق في المرتين.");
  }
  const iterations = 310000;
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const sessionSecret = randomBytes(48).toString("base64url");
  console.log("\nانسخ القيمتين مباشرة إلى Cloudflare Secrets. لا تضفهما إلى ملفات المشروع أو GitHub:\n");
  console.log(`JAMRA_ADMIN_PASSWORD_HASH=pbkdf2-sha256$${iterations}$${salt.toString("base64url")}$${hash.toString("base64url")}`);
  console.log(`JAMRA_SESSION_SECRET=${sessionSecret}`);
} finally {
  terminal.close();
}
