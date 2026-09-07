// יוצר את אייקוני ה-PWA כ-PNG בלי תלויות חיצוניות.
// מצייר רקע דיו כהה עם שלושה "רסיסים" (פסים אופקיים) בצבע נייר.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
mkdirSync(publicDir, { recursive: true });

const INK = [28, 25, 23, 255]; // #1c1917
const PAPER = [250, 249, 247, 255]; // #faf9f7

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const raster = Buffer.alloc(size * size * 4);
  const put = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const o = (y * size + x) * 4;
    raster[o] = r;
    raster[o + 1] = g;
    raster[o + 2] = b;
    raster[o + 3] = a;
  };

  // רקע דיו.
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) put(x, y, INK);

  // שלושה פסים בצבע נייר, ברוחב יורד — רמז ל"רסיסים".
  const bars = [
    { w: 0.52, y: 0.32 },
    { w: 0.4, y: 0.5 },
    { w: 0.46, y: 0.68 },
  ];
  const h = Math.round(size * 0.075);
  const x0 = Math.round(size * 0.24);
  for (const bar of bars) {
    const bw = Math.round(size * bar.w);
    const by = Math.round(size * bar.y);
    for (let y = by; y < by + h; y++)
      for (let x = x0; x < x0 + bw; x++) put(x, y, PAPER);
  }

  // קידוד: כל שורה מקבלת byte של filter=0.
  const stride = size * 4;
  const rawrows = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    rawrows[y * (stride + 1)] = 0;
    raster.copy(rawrows, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(rawrows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(join(publicDir, 'pwa-192x192.png'), png(192));
writeFileSync(join(publicDir, 'pwa-512x512.png'), png(512));
writeFileSync(join(publicDir, 'apple-touch-icon.png'), png(180));

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#1c1917"/>
  <rect x="15" y="20" width="34" height="5" rx="2.5" fill="#faf9f7"/>
  <rect x="15" y="32" width="26" height="5" rx="2.5" fill="#faf9f7"/>
  <rect x="15" y="44" width="30" height="5" rx="2.5" fill="#faf9f7"/>
</svg>`;
writeFileSync(join(publicDir, 'favicon.svg'), favicon);

console.log('icons written to public/');
