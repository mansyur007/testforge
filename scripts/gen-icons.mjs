// F-36 Part A: generate the PWA icon PNGs from the TestForge mark geometry
// (mirrors src/app/icon.svg). Pure Node — no image library, no CLI converter:
// a tiny software rasterizer (4× supersampled) writes RGBA buffers, encoded to
// PNG via the built-in zlib. Run manually to (re)generate the committed files:
//
//   node scripts/gen-icons.mjs
//
// Outputs public/icons/icon-192.png, icon-512.png, icon-512-maskable.png.
// Keep colors in sync with src/app/icon.svg / the design tokens (§7.1).

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const INDIGO = [79, 70, 229]; // #4f46e5 accent
const WHITE = [255, 255, 255];
const SPARK = [199, 210, 254]; // #c7d2fe
const SS = 4; // supersampling factor for anti-aliasing

// --- geometry tests, all in the icon.svg 0..100 coordinate space ------------
function inRoundedRect(x, y, rx, ry, w, h, r) {
  if (x < rx || x > rx + w || y < ry || y > ry + h) return false;
  const cx = Math.min(Math.max(x, rx + r), rx + w - r);
  const cy = Math.min(Math.max(y, ry + r), ry + h - r);
  const dx = x - cx;
  const dy = y - cy;
  // inside the straight band, or within r of the nearest corner center
  if (x >= rx + r && x <= rx + w - r) return true;
  if (y >= ry + r && y <= ry + h - r) return true;
  return dx * dx + dy * dy <= r * r;
}
function inPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
function nearSegment(x, y, x1, y1, x2, y2, hw) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((x - x1) * dx + (y - y1) * dy) / len2 : 0;
  t = Math.min(1, Math.max(0, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const ex = x - px;
  const ey = y - py;
  return ex * ex + ey * ey <= hw * hw; // round caps fall out of distance test
}

// White anvil + light sparks, in svg units. Returns [r,g,b] or null.
function markColor(u, v) {
  // sparks sit on top
  if (nearSegment(u, v, 68, 33, 74, 28, 2) || nearSegment(u, v, 76, 40, 82, 38, 2))
    return SPARK;
  if (
    inRoundedRect(u, v, 28, 40, 44, 10, 3) ||
    inPolygon(u, v, [[28, 41], [19, 45.5], [28, 50]]) ||
    inPolygon(u, v, [[44, 50], [56, 50], [63, 67], [37, 67]]) ||
    inRoundedRect(u, v, 35, 65, 30, 5, 2)
  )
    return WHITE;
  return null;
}

// Mark bounding box (sparks included) for the maskable centering transform.
const MARK = { x0: 19, y0: 28, x1: 82, y1: 70 };

function sampleNormal(u, v) {
  if (!inRoundedRect(u, v, 0, 0, 100, 100, 22)) return [0, 0, 0, 0];
  const m = markColor(u, v);
  return m ? [...m, 255] : [...INDIGO, 255];
}

function render(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  // maskable: mark scaled to 60% of the square, centered, on a full indigo bg.
  const markW = MARK.x1 - MARK.x0;
  const markH = MARK.y1 - MARK.y0;
  const scale = (0.6 * size) / Math.max(markW, markH);
  const ox = size / 2 - ((MARK.x0 + MARK.x1) / 2) * scale;
  const oy = size / 2 - ((MARK.y0 + MARK.y1) / 2) * scale;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const cx = px + (sx + 0.5) / SS;
          const cy = py + (sy + 0.5) / SS;
          let s;
          if (!maskable) {
            s = sampleNormal((cx / size) * 100, (cy / size) * 100);
          } else {
            const m = markColor((cx - ox) / scale, (cy - oy) / scale);
            s = m ? [...m, 255] : [...INDIGO, 255];
          }
          r += s[0]; g += s[1]; b += s[2]; a += s[3];
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
    }
  }
  return buf;
}

// --- minimal PNG encoder (RGBA, filter 0) -----------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const [name, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-512-maskable.png", 512, true],
]) {
  writeFileSync(`public/icons/${name}`, encodePng(size, render(size, maskable)));
  console.log(`wrote public/icons/${name}`);
}
