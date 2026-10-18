#!/usr/bin/env node
/**
 * Generates the PWA icons without external tools: a parchment cross within a
 * gold seal ring on the conciliar red. Run with `npm run icons`.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(join(out, 'icons'), { recursive: true });

const RED = [0x7a, 0x1f, 0x1f];
const PARCHMENT = [0xfa, 0xf8, 0xf3];
const GOLD = [0xb0, 0x8d, 0x4f];

/** Colour of the glyph at normalised coords (centre 0,0; radius 1 = half size): seal ring and cross. */
function shade(x, y, scale) {
  const u = x / scale;
  const v = y / scale;
  const r = Math.hypot(u, v);
  if (r >= 0.74 && r <= 0.8) return GOLD;
  if (r >= 0.66 && r <= 0.685) return GOLD;
  const upright = Math.abs(u) <= 0.075 && v >= -0.46 && v <= 0.46;
  const beam = Math.abs(v + 0.12) <= 0.075 && Math.abs(u) <= 0.3;
  if (upright || beam) return PARCHMENT;
  return null;
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, scale) {
  const SS = 4; // supersampling for anti-aliasing
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = ((px + (sx + 0.5) / SS) / size) * 2 - 1;
          const y = ((py + (sy + 0.5) / SS) / size) * 2 - 1;
          const c = shade(x, y, scale) ?? RED;
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
        }
      }
      const o = py * (size * 3 + 1) + 1 + px * 3;
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(acc[i] / (SS * SS));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(join(out, 'icons', 'icon-192.png'), png(192, 1));
writeFileSync(join(out, 'icons', 'icon-512.png'), png(512, 1));
// Maskable: keep the glyph inside the 80% safe zone.
writeFileSync(join(out, 'icons', 'icon-maskable-512.png'), png(512, 0.72));
writeFileSync(join(out, 'icons', 'apple-touch-icon.png'), png(180, 0.85));

writeFileSync(
  join(out, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#7A1F1F"/><path d="M48.3 20.4A20 20 0 1 0 48.3 43.6" fill="none" stroke="#FAF8F3" stroke-width="7"/><circle cx="32" cy="32" r="4.5" fill="#B08D4F"/></svg>\n`,
);
console.log('icons written');
