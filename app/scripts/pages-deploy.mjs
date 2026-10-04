import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const deploymentsDir = join(appRoot, "deployments");
const artifactsDir = join(deploymentsDir, "artifacts");
const historyPath = join(deploymentsDir, "history.json");
const projectName = "biyeflow";

function run(command, options = {}) {
  return execSync(command, {
    cwd: appRoot,
    stdio: options.inherit ? "inherit" : "pipe",
    encoding: "utf8",
  });
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getProductionDeployment() {
  const raw = run(`npx wrangler pages deployment list --project-name=${projectName} --json`);
  const deployments = JSON.parse(raw);
  return deployments.find((entry) => entry.Environment === "Production") ?? deployments[0];
}

const pkg = JSON.parse(readFileSync(join(appRoot, "package.json"), "utf8"));
const appVersion = pkg.version;
const deployLabel =
  process.env.DEPLOY_LABEL ||
  `v${appVersion}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

mkdirSync(artifactsDir, { recursive: true });

const previous = getProductionDeployment();
const previousId = previous?.Id;
const previousCurrent = readJson(join(deploymentsDir, "current.json"), null);

if (previousId) {
  writeJson(join(deploymentsDir, "last-known-good.json"), {
    deploymentId: previousId,
    environment: previous.Environment,
    url: previous.Deployment,
    productionUrl: "https://biyeflow.pages.dev",
    savedAt: new Date().toISOString(),
    dashboardUrl: previous.Build,
    appVersion: previousCurrent?.appVersion ?? null,
    deployLabel: previousCurrent?.deployLabel ?? null,
    buildId: previousCurrent?.buildId ?? null,
  });

  const distDir = join(appRoot, "dist");
  if (existsSync(distDir)) {
    const artifactDir = join(artifactsDir, previousId);
    rmSync(artifactDir, { recursive: true, force: true });
    cpSync(distDir, artifactDir, { recursive: true });
    console.log(`Saved rollback artifact for ${previousId}`);
  }
}

console.log(`Deploying ${deployLabel} (app ${appVersion})...`);
console.log("Building production bundle...");
run("npm run icons", { inherit: true });
run("npm run build", { inherit: true });

const versionPath = join(appRoot, "dist", "version.json");
const versionData = readJson(versionPath, {});
versionData.appVersion = appVersion;
versionData.deployLabel = deployLabel;
writeJson(versionPath, versionData);
console.log(`version.json → ${JSON.stringify(versionData)}`);

console.log("Deploying to Cloudflare Pages...");
const deployOutput = run(
  `npx wrangler pages deploy dist --project-name=${projectName} --branch=main --commit-dirty=true`,
);
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
    appVersion,
    deployLabel,
    buildId: versionData.buildId ?? null,
  };
  writeJson(join(deploymentsDir, "current.json"), current);

  const history = readJson(historyPath, []);
  history.unshift({
    ...current,
    rolledBackFrom: null,
  });
  writeJson(historyPath, history.slice(0, 20));

  console.log(`\nDeployed: https://biyeflow.pages.dev`);
  console.log(`Version: ${deployLabel} (app ${appVersion})`);
  console.log(`Deployment ID: ${latest.Id}`);
  console.log(`Check version: https://biyeflow.pages.dev/version.json`);
  if (previousId) {
    console.log(`Rollback target saved: ${previousId}`);
    console.log(`Run: npm run deploy:rollback`);
  }
} else {
  console.log("\nDeploy finished. Check Cloudflare dashboard for deployment details.");
}
