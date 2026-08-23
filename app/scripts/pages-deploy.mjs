import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const deploymentsDir = join(appRoot, "deployments");
const artifactsDir = join(deploymentsDir, "artifacts");
const projectName = "biyeflow";

function run(command, options = {}) {
  return execSync(command, {
    cwd: appRoot,
    stdio: options.inherit ? "inherit" : "pipe",
    encoding: "utf8",
  });
}

function getProductionDeployment() {
  const raw = run(`npx wrangler pages deployment list --project-name=${projectName} --json`);
  const deployments = JSON.parse(raw);
  return deployments.find((entry) => entry.Environment === "Production") ?? deployments[0];
}

mkdirSync(artifactsDir, { recursive: true });

const previous = getProductionDeployment();
const previousId = previous?.Id;

if (previousId) {
  const snapshot = {
    deploymentId: previousId,
    environment: previous.Environment,
    url: previous.Deployment,
    productionUrl: "https://biyeflow.pages.dev",
    savedAt: new Date().toISOString(),
    dashboardUrl: previous.Build,
  };

  writeFileSync(
    join(deploymentsDir, "last-known-good.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8",
  );

  const distDir = join(appRoot, "dist");
  if (existsSync(distDir)) {
    const artifactDir = join(artifactsDir, previousId);
    rmSync(artifactDir, { recursive: true, force: true });
    cpSync(distDir, artifactDir, { recursive: true });
    console.log(`Saved rollback artifact for ${previousId}`);
  }
}

console.log("Building production bundle...");
run("npm run icons", { inherit: true });
run("npm run build", { inherit: true });

console.log("Deploying to Cloudflare Pages...");
const deployOutput = run(`npx wrangler pages deploy dist --project-name=${projectName}`);
process.stdout.write(deployOutput);

const latest = getProductionDeployment();
if (latest?.Id) {
  const current = {
    deploymentId: latest.Id,
    url: latest.Deployment,
    productionUrl: "https://biyeflow.pages.dev",
    deployedAt: new Date().toISOString(),
    dashboardUrl: latest.Build,
    rollbackTarget: previousId ?? null,
  };
  writeFileSync(join(deploymentsDir, "current.json"), `${JSON.stringify(current, null, 2)}\n`, "utf8");
  console.log(`\nDeployed: https://biyeflow.pages.dev`);
  console.log(`Deployment ID: ${latest.Id}`);
  if (previousId) {
    console.log(`Rollback target saved: ${previousId}`);
    console.log(`Run: npm run deploy:rollback`);
  }
} else {
  console.log("\nDeploy finished. Check Cloudflare dashboard for deployment details.");
}
