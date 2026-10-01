#!/usr/bin/env node
// Builds the founder portraits from high-resolution originals. Run it again when the founders send
// new portraits:
//   npm run assets -- --source <folder with the originals>
// The logo, favicons and app icons come from the vector mark instead: see `npm run icons`.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FOUNDERS = [
  // Crops are fractions of the source image: horizontal centre, top edge, width.
  { source: "esala.jpeg", output: "esala.jpg", centreX: 0.5, top: 0.03, width: 0.44 },
  { source: "Umesh.jpeg", output: "umesh.jpg", centreX: 0.49, top: 0.03, width: 0.44 },
  { source: "Dulaj.jpeg", output: "dulaj.jpg", centreX: 0.5, top: 0.04, width: 0.44 },
];
const PORTRAIT = { width: 960, height: 1200 };

function readSourceDir() {
  const index = process.argv.indexOf("--source");
  const dir = index === -1 ? undefined : process.argv[index + 1];
  if (!dir) {
    console.error("Usage: npm run assets -- --source <folder with the original images>");
    process.exit(1);
  }
  return path.resolve(dir);
}

async function portrait(sourceDir, { source, output, centreX, top, width }) {
  const input = sharp(path.join(sourceDir, source));
  const { width: w, height: h } = await input.metadata();
  const cropWidth = Math.round(w * width);
  const cropHeight = Math.min(Math.round((cropWidth * PORTRAIT.height) / PORTRAIT.width), h);
  const left = Math.max(0, Math.min(w - cropWidth, Math.round(w * centreX - cropWidth / 2)));
  const cropTop = Math.max(0, Math.min(h - cropHeight, Math.round(h * top)));

  const file = path.join(root, "src/assets/founders", output);
  await input
    .extract({ left, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(PORTRAIT.width, PORTRAIT.height, { fit: "cover" })
    .grayscale()
    .linear(1.06, -6)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(file);
  return file;
}

async function main() {
  const sourceDir = readSourceDir();
  await mkdir(path.join(root, "src/assets/founders"), { recursive: true });
  const written = await Promise.all(FOUNDERS.map((founder) => portrait(sourceDir, founder)));
  for (const file of written) {
    console.info(`wrote ${path.relative(root, file)}`);
  }
}

main().catch((error) => {
  console.error("Asset preparation failed:", error);
  process.exit(1);
});
