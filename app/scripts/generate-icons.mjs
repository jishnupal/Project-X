import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const iconsDir = path.join(publicDir, "icons");
const svg = fs.readFileSync(path.join(publicDir, "favicon.svg"));

fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [180, 192, 512]) {
  const filename = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  const outPath = size === 180 ? path.join(publicDir, filename) : path.join(iconsDir, filename);
  await sharp(svg).resize(size, size).png().toFile(outPath);
  console.log(`Generated ${filename}`);
}
