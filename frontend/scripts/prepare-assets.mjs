#!/usr/bin/env node
// Builds the site's brand and founder images from high-resolution originals.
// Run it again when the founders send new portraits or the logo changes:
//   npm run assets -- --source <folder with the originals>
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHARCOAL = "#16181A";

const FOUNDERS = [
  // Crops are fractions of the source image: horizontal centre, top edge, width.
  { source: "esala.jpeg", output: "esala.jpg", centreX: 0.5, top: 0.03, width: 0.44 },
  { source: "Umesh.jpeg", output: "umesh.jpg", centreX: 0.49, top: 0.03, width: 0.44 },
  { source: "Dulaj.jpeg", output: "dulaj.jpg", centreX: 0.5, top: 0.04, width: 0.44 },
];
const MARK_SOURCE = "Picsart_26-05-16_12-38-41-955.png";
const LOGO_SOURCE = "logo.png";
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

async function trimmedMark(sourceDir) {
  return sharp(path.join(sourceDir, MARK_SOURCE)).trim().png().toBuffer();
}

async function tile(mark, size, { radius, markScale }) {
  const markSize = Math.round(size * markScale);
  const resizedMark = await sharp(mark)
    .resize(markSize, markSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${CHARCOAL}"/></svg>`
  );
  return sharp(background)
    .composite([{ input: resizedMark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// An ICO file can wrap a PNG directly: a 6-byte header, one 16-byte entry, then the PNG.
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, png]);
}

async function shareImage(sourceDir) {
  const logo = await sharp(path.join(sourceDir, LOGO_SOURCE))
    .trim()
    .resize({ height: 330, fit: "inside" })
    .toBuffer();
  return sharp({ create: { width: 1200, height: 630, channels: 4, background: CHARCOAL } })
    .composite([{ input: logo, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  const sourceDir = readSourceDir();
  await Promise.all(
    ["src/assets/founders", "src/assets/brand", "public/og"].map((dir) =>
      mkdir(path.join(root, dir), { recursive: true })
    )
  );

  const written = await Promise.all(FOUNDERS.map((founder) => portrait(sourceDir, founder)));

  const mark = await trimmedMark(sourceDir);
  const markFile = path.join(root, "src/assets/brand/trivista-mark.png");
  await sharp(mark).resize({ width: 512, fit: "inside" }).png({ compressionLevel: 9 }).toFile(markFile);
  written.push(markFile);

  const icons = [
    { file: "public/icon-192.png", size: 192, radius: 36, markScale: 0.66 },
    { file: "public/icon-512.png", size: 512, radius: 96, markScale: 0.66 },
    { file: "public/apple-touch-icon.png", size: 180, radius: 0, markScale: 0.62 },
  ];
  for (const icon of icons) {
    const png = await tile(mark, icon.size, icon);
    await writeFile(path.join(root, icon.file), png);
    written.push(path.join(root, icon.file));
  }

  const favicon = await tile(mark, 32, { radius: 6, markScale: 0.78 });
  await writeFile(path.join(root, "public/favicon.ico"), pngToIco(favicon, 32));
  written.push(path.join(root, "public/favicon.ico"));

  await writeFile(path.join(root, "public/og/default.png"), await shareImage(sourceDir));
  written.push(path.join(root, "public/og/default.png"));

  for (const file of written) {
    console.info(`wrote ${path.relative(root, file)}`);
  }
}

main().catch((error) => {
  console.error("Asset preparation failed:", error);
  process.exit(1);
});
