#!/usr/bin/env node
/**
 * gen-icons.js
 * Generates minimal valid solid-green PNG icons for the PWA manifest.
 * Uses only Node.js built-in modules (no native canvas dependency).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'public');

// ---- PNG helpers ----

function crc32(buf) {
  // Standard CRC-32 used by PNG
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  // length (4) + type (4) + data (n) + crc (4)
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
}

function buildPng(width, height, r, g, b) {
  // --- PNG Signature ---
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // --- IHDR ---
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);  // height
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 2;   // color type: RGB
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // --- IDAT (image data) ---
  // Each row: filter byte (0 = None) followed by width * 3 bytes (RGB)
  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const offset = y * rowBytes;
    raw[offset] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      raw[px]     = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);

  // --- IEND ---
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// ---- Generate icons ----
// Green color: #22c55e  (Tailwind green-500)
const R = 0x22, G = 0xc5, B = 0x5e;

const sizes = [192, 512];

for (const size of sizes) {
  const png = buildPng(size, size, R, G, B);
  const outPath = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Created ${outPath}  (${png.length} bytes, ${size}x${size})`);
}

console.log('Done.');
