#!/usr/bin/env node
/**
 * Free-tier R2 setup for invite media.
 * 1) Enable R2 once in the dashboard (Storage → R2 → Get started). Free tier: 10GB.
 * 2) Run: node scripts/ensure-r2-media.mjs
 * 3) npm run deploy
 */
import { spawnSync } from "node:child_process";

const BUCKET = "biyeflow-media";
const ACCOUNT_R2 =
  "https://dash.cloudflare.com/27857c28351b7beebf8a8fa95a7f0ebc/r2";

function run(args) {
  return spawnSync("npx", ["wrangler", ...args], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
}

console.log("Checking R2 free-tier bucket:", BUCKET);

const list = run(["r2", "bucket", "list"]);
const listOut = `${list.stdout || ""}${list.stderr || ""}`;

if (list.status !== 0 && /enable R2|10042/i.test(listOut)) {
  console.error(`
R2 is not enabled on this Cloudflare account yet.

Do this once (free tier — 10GB storage, free egress):
  1. Open: ${ACCOUNT_R2}
  2. Click Get started / Purchase R2 (card may be required; usage stays $0 in free tier)
  3. Re-run: node scripts/ensure-r2-media.mjs
  4. npm run deploy

Until then, Film uploads ≤20MB still work via KV (already free).
`);
  process.exit(1);
}

if (/biyeflow-media/.test(listOut)) {
  console.log("Bucket already exists:", BUCKET);
  process.exit(0);
}

console.log("Creating bucket:", BUCKET);
const create = run(["r2", "bucket", "create", BUCKET]);
const createOut = `${create.stdout || ""}${create.stderr || ""}`;
console.log(createOut);

if (create.status !== 0 && !/already exists/i.test(createOut)) {
  console.error("Could not create bucket. See errors above.");
  process.exit(1);
}

console.log("Done. Next: npm run deploy");
