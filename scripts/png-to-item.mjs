#!/usr/bin/env node
/**
 * png-to-item.mjs
 * ドット絵の PNG を、src/lib/kirby.ts の px16() にそのまま貼れるコードに変換します。
 *
 *   node scripts/png-to-item.mjs <file.png> [id] [日本語名] [rarity] [--size 16]
 *
 * - 透明（アルファ < 128）は '.' になります
 * - 拡大して書き出した画像（例: 160×160）でも --size に合わせて縮小します
 * - 外部ライブラリなし（Node 標準の zlib だけ）
 */
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const args = process.argv.slice(2);
const sizeIdx = args.indexOf("--size");
const size = sizeIdx >= 0 ? parseInt(args.splice(sizeIdx, 2)[1], 10) : 16;
const [file, id = path.basename(file ?? "", ".png"), nameJa = id, rarity = "common"] = args;
if (!file) {
  console.error("usage: node scripts/png-to-item.mjs <file.png> [id] [日本語名] [rarity] [--size 16]");
  process.exit(1);
}

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("PNG ではありません");
  let off = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0, plte = null, trns = null;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const kind = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (kind === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; type = data[9]; interlace = data[12];
    } else if (kind === "PLTE") plte = data;
    else if (kind === "tRNS") trns = data;
    else if (kind === "IDAT") idat.push(data);
    off += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || ![2, 3, 6].includes(type)) {
    throw new Error("8bit・非インターレースの RGB / RGBA / パレット PNG で書き出してください");
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : 1;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let v = src[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = v & 0xff;
    }
  }
  const rgba = (x, y) => {
    const i = y * stride + x * bpp;
    if (type === 3) {
      const k = px[i];
      return [plte[k * 3], plte[k * 3 + 1], plte[k * 3 + 2], trns && k < trns.length ? trns[k] : 255];
    }
    return [px[i], px[i + 1], px[i + 2], type === 6 ? px[i + 3] : 255];
  };
  return { width, height, rgba };
}

const { width, height, rgba } = decodePng(fs.readFileSync(file));
const scaleX = width / size, scaleY = height / size;
const hex = (n) => n.toString(16).padStart(2, "0").toUpperCase();
const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const palette = new Map();
const rows = [];
for (let y = 0; y < size; y++) {
  let row = "";
  for (let x = 0; x < size; x++) {
    // sample the centre of each block so upscaled exports work too
    const [r, g, b, a] = rgba(Math.floor((x + 0.5) * scaleX), Math.floor((y + 0.5) * scaleY));
    if (a < 128) { row += "."; continue; }
    const color = `#${hex(r)}${hex(g)}${hex(b)}`;
    if (!palette.has(color)) {
      if (palette.size >= LETTERS.length) throw new Error("色が多すぎます（62色まで）");
      palette.set(color, LETTERS[palette.size]);
    }
    row += palette.get(color);
  }
  rows.push(row);
}

const pal = [...palette].map(([c, k]) => `${k}: "${c}"`).join(", ");
const name = id.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
console.log(`  px${size === 16 ? "16" : ""}("${id}", "${name}", "${nameJa}", "${rarity}",
    { ${pal} }, [
${rows.map((r) => `    "${r}",`).join("\n")}
  ]),`);
