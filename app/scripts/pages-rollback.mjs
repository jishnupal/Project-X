import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const deploymentsDir = join(appRoot, "deployments");
const projectName = "biyeflow";
const snapshotPath = join(deploymentsDir, "last-known-good.json");

if (!existsSync(snapshotPath)) {
  console.error("No rollback snapshot found. Deploy once with `npm run deploy` first.");
  process.exit(1);
}

const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
const deploymentId = snapshot.deploymentId;
const artifactDir = join(deploymentsDir, "artifacts", deploymentId);

if (!deploymentId) {
  console.error("Rollback snapshot is missing deploymentId.");
  process.exit(1);
}

console.log(`Rolling back to deployment ${deploymentId}`);
console.log(`Preview URL: ${snapshot.url}`);
console.log(`Dashboard: ${snapshot.dashboardUrl}`);

if (!existsSync(artifactDir)) {
  console.error("\nLocal artifact for this deployment was not found.");
  console.error("Use Cloudflare dashboard rollback instead:");
  console.error(snapshot.dashboardUrl);
  process.exit(1);
}

execSync(`npx wrangler pages deploy "${artifactDir}" --project-name=${projectName}`, {
  cwd: appRoot,
  stdio: "inherit",
});

console.log("\nRollback deploy submitted.");
console.log("Production should now match the previous build at https://biyeflow.pages.dev");
