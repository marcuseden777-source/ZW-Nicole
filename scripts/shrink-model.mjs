#!/usr/bin/env node
/**
 * Make a generated GLB fit for a wedding invitation.
 *
 * A mesh converted from a photograph arrives with a 2048x2048 baked texture,
 * which is 4.2 MB of a 6 MB file. That is a sensible default for a model you
 * will inspect up close and a bad one for decoration at the edge of a page,
 * where it is never more than a couple of hundred pixels across — and it is
 * paid for by every guest, on whatever signal they have at the venue.
 *
 * This rewrites the texture smaller and repacks the binary chunk. Geometry is
 * untouched: 31k triangles is nothing, and decimating it would cost shape.
 *
 *   node scripts/shrink-model.mjs public/models/blossom.glb [--size 1024] [--quality 78]
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const [file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const SIZE = flag("size", 1024);
const QUALITY = flag("quality", 78);

if (!file) {
  console.error("usage: node scripts/shrink-model.mjs <file.glb> [--size 1024] [--quality 78]");
  process.exit(1);
}

const glb = readFileSync(file);
if (glb.toString("ascii", 0, 4) !== "glTF") {
  console.error(`${file} is not a binary glTF.`);
  process.exit(1);
}

const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength));
// The BIN chunk header sits straight after the JSON chunk: length, then type.
const binHeader = 20 + jsonLength;
const binLength = glb.readUInt32LE(binHeader);
const bin = glb.subarray(binHeader + 8, binHeader + 8 + binLength);

if (!json.images?.length) {
  console.log("No embedded images — nothing to shrink.");
  process.exit(0);
}

// Pull every bufferView out as its own buffer, so they can be repacked at new
// offsets once one of them changes size.
const slices = json.bufferViews.map((view) => {
  const from = view.byteOffset ?? 0;
  return Buffer.from(bin.subarray(from, from + view.byteLength));
});

let saved = 0;
for (const image of json.images) {
  if (image.bufferView === undefined) continue;
  const before = slices[image.bufferView];
  const meta = await sharp(before).metadata();
  if ((meta.width ?? 0) <= SIZE) {
    console.log(`  image ${meta.width}x${meta.height} already within ${SIZE}px — left alone`);
    continue;
  }
  const after = await sharp(before)
    .resize(SIZE, SIZE, { fit: "inside" })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
  console.log(
    `  image ${meta.width}x${meta.height} ${(before.length / 1048576).toFixed(2)} MB` +
      ` -> ${SIZE}px ${(after.length / 1048576).toFixed(2)} MB`,
  );
  saved += before.length - after.length;
  slices[image.bufferView] = after;
  image.mimeType = "image/jpeg";
}

if (saved <= 0) {
  console.log("Nothing to save.");
  process.exit(0);
}

// Repack. Every bufferView must start on a four-byte boundary or the loader
// reads accessors off by a byte or two and the mesh arrives as confetti.
const packed = [];
let offset = 0;
json.bufferViews.forEach((view, i) => {
  const pad = (4 - (offset % 4)) % 4;
  if (pad) {
    packed.push(Buffer.alloc(pad));
    offset += pad;
  }
  view.byteOffset = offset;
  view.byteLength = slices[i].length;
  packed.push(slices[i]);
  offset += slices[i].length;
});

const newBin = Buffer.concat(packed);
json.buffers[0].byteLength = newBin.length;

// Both chunks are padded to four bytes: JSON with spaces, BIN with zeroes.
const jsonBuf = Buffer.from(JSON.stringify(json), "utf8");
const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
const jsonChunk = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);
const binPad = (4 - (newBin.length % 4)) % 4;
const binChunk = Buffer.concat([newBin, Buffer.alloc(binPad, 0)]);

const out = Buffer.alloc(12 + 8 + jsonChunk.length + 8 + binChunk.length);
out.write("glTF", 0, "ascii");
out.writeUInt32LE(2, 4);
out.writeUInt32LE(out.length, 8);
out.writeUInt32LE(jsonChunk.length, 12);
out.write("JSON", 16, "ascii");
jsonChunk.copy(out, 20);
const binAt = 20 + jsonChunk.length;
out.writeUInt32LE(binChunk.length, binAt);
out.write("BIN\0", binAt + 4, "ascii");
binChunk.copy(out, binAt + 8);

writeFileSync(file, out);
console.log(
  `${file}: ${(glb.length / 1048576).toFixed(2)} MB -> ${(out.length / 1048576).toFixed(2)} MB`,
);
