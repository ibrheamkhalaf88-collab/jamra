import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const configPath = resolve(root, "dist/server/wrangler.json");
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
const databaseName = process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim();
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();
const workerName = process.env.CLOUDFLARE_WORKER_NAME?.trim() || "jamra";

if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  throw new Error("Set CLOUDFLARE_ACCOUNT_ID in the environment.");
}
if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.log("No API token supplied; Wrangler will use the saved login from `wrangler login`.");
}
if (!databaseId || !databaseName || !bucketName) {
  throw new Error("Set CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_D1_DATABASE_NAME, and CLOUDFLARE_R2_BUCKET_NAME.");
}

const config = JSON.parse(await readFile(configPath, "utf8"));
config.name = workerName;
config.topLevelName = workerName;
const d1 = config.d1_databases?.find((binding) => binding.binding === "DB");
const r2 = config.r2_buckets?.find((binding) => binding.binding === "BUCKET");
if (!d1 || !r2) throw new Error("Built Worker config is missing DB or BUCKET bindings.");
d1.database_id = databaseId;
d1.database_name = databaseName;
r2.bucket_name = bucketName;
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

const wrangler = resolve(root, "node_modules/wrangler/bin/wrangler.js");
const result = spawnSync(process.execPath, [wrangler, "deploy", "--config", configPath], { cwd: root, stdio: "inherit", env: process.env });
if (result.error) throw result.error;
if (result.status !== 0) process.exitCode = result.status ?? 1;
