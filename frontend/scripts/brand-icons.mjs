#!/usr/bin/env node
// Builds the favicons and app icons from the vector mark in src/data/brand.ts, so they stay sharp
// and match the logo in the header. Run after changing the mark:
//   npm run icons
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PENROSE_FACES, PENROSE_VIEWBOX } from "../src/data/brand.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHARCOAL = "#16181A";

/** The mark on a charcoal tile. `cut` slices two corners at 60 degrees, like the site's frames. */
function tileSvg(size, { cut, markScale }) {
  const c = cut ? size * 0.14 : 0;
  const cy = c * 1.732;
  const ground = cut
    ? `<path d="M${c} 0H${size}V${size - cy}L${size - c} ${size}H0V${cy}Z" fill="${CHARCOAL}"/>`
    : `<rect width="${size}" height="${size}" fill="${CHARCOAL}"/>`;
  const scale = (size * markScale) / PENROSE_VIEWBOX.width;
  const x = (size - PENROSE_VIEWBOX.width * scale) / 2;
  const y = (size - PENROSE_VIEWBOX.height * scale) / 2;
  const faces = PENROSE_FACES.map(
    (face) =>
      `<polygon points="${face.points.map(([px, py]) => `${px},${py}`).join(" ")}" fill="${face.fill}" stroke="${face.fill}" stroke-width="0.4" stroke-linejoin="round"/>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${ground}<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})">${faces}</g></svg>`;
}

// An ICO file can wrap a PNG directly: a 6-byte header, one 16-byte entry, then the PNG.
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const png = (svg) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

// Browser tabs: the cut tile. App icons: a full square, because phones mask their own corners.
const outputs = [
  ["public/favicon.svg", Buffer.from(tileSvg(64, { cut: true, markScale: 0.72 }))],
  ["public/favicon.ico", pngToIco(await png(tileSvg(32, { cut: true, markScale: 0.74 })), 32)],
  ["public/icon-192.png", await png(tileSvg(192, { cut: false, markScale: 0.62 }))],
  ["public/icon-512.png", await png(tileSvg(512, { cut: false, markScale: 0.62 }))],
  ["public/apple-touch-icon.png", await png(tileSvg(180, { cut: false, markScale: 0.6 }))],
];
for (const [file, data] of outputs) {
  await writeFile(path.join(root, file), data);
  console.log(`${file} (${data.length} bytes)`);
}
