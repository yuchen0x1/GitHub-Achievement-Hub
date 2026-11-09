#!/usr/bin/env node
/**
 * 生成桌面端图标（零依赖）。
 *
 * 产出：
 *   icons/icon.png          512x512
 *   icons/128x128@2x.png    256x256
 *   icons/128x128.png       128x128
 *   icons/32x32.png          32x32
 *   icons/icon.ico          16/32/48/256 四尺寸（32 位 BGRA DIB，兼容性最好）
 *
 * 编码说明：
 *   - PNG：手写 chunk + CRC32，IDAT 用 zlib.deflateSync（Node 内置）。
 *   - ICO：Windows 经典 BITMAPINFOHEADER + 自底向上 BGRA + AND 掩码，
 *          不使用 PNG 内嵌条目，避免 rc.exe / 资源编译器兼容性问题。
 *   - 渲染：4x 超采样后盒式降采样，得到抗锯齿边缘。
 *
 * 用法：node scripts/gen-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'src-tauri', 'icons');

/* ------------------------------------------------------------------ 颜色 */

const BG_TOP = [22, 27, 34, 255]; // #161b22
const BG_BOTTOM = [13, 17, 23, 255]; // #0d1117
const ACCENT = [63, 185, 80, 255]; // #3fb950 GitHub 绿
const FG = [230, 237, 243, 255]; // #e6edf3

/* ------------------------------------------------------- 5x7 点阵字体 */

const FONT = {
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
};

/** 计算一串文字在点阵坐标系中的宽度（含字符间距 1） */
function textUnits(text) {
  return text.length * 5 + (text.length - 1);
}

/* ------------------------------------------------------------ 渲染器 */

/**
 * 在 size×size 的 RGBA 缓冲上绘制图案（这是超采样后的逻辑，坐标为像素）。
 * @param {number} size
 * @returns {Uint8Array} RGBA
 */
function render(size) {
  const buf = new Uint8Array(size * size * 4);
  const radius = Math.max(2, Math.round(size * 0.18));

  const setPx = (x, y, c) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = c[0];
    buf[i + 1] = c[1];
    buf[i + 2] = c[2];
    buf[i + 3] = c[3];
  };

  const fillRoundRect = (x0, y0, x1, y1, r, colorFn) => {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        // 圆角裁剪
        const dx = Math.min(x - x0, x1 - 1 - x);
        const dy = Math.min(y - y0, y1 - 1 - y);
        if (dx < r && dy < r) {
          const cx = r - dx;
          const cy = r - dy;
          if (cx * cx + cy * cy > r * r) continue;
        }
        setPx(x, y, colorFn(x, y));
      }
    }
  };

  // 背景：垂直线性渐变
  fillRoundRect(0, 0, size, size, radius, (x, y) => {
    const t = y / (size - 1);
    const c = [0, 0, 0, 255];
    for (let k = 0; k < 4; k++) c[k] = Math.round(BG_TOP[k] + (BG_BOTTOM[k] - BG_TOP[k]) * t);
    return c;
  });

  // 顶部强调线
  const barH = Math.max(1, Math.round(size * 0.022));
  fillRoundRect(
    Math.round(size * 0.16),
    Math.round(size * 0.115),
    Math.round(size * 0.84),
    Math.round(size * 0.115) + barH,
    0,
    () => ACCENT,
  );

  // 文字：小尺寸只画 "G"，大尺寸画 "GACH"
  const text = size >= 96 ? 'GACH' : 'G';
  const units = textUnits(text);
  const targetW = size * (size >= 96 ? 0.6 : 0.34);
  const scale = Math.max(1, Math.floor(targetW / units));
  const textW = units * scale;
  const textH = 7 * scale;
  const ox = Math.round((size - textW) / 2);
  const oy = Math.round((size - textH) / 2 + size * 0.03);

  for (let ci = 0; ci < text.length; ci++) {
    const glyph = FONT[text[ci]];
    const gx = ox + ci * (5 + 1) * scale;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] !== '1') continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            setPx(gx + col * scale + sx, oy + row * scale + sy, FG);
          }
        }
      }
    }
  }

  // 底部强调短线（仅在较大的图标上，避免小图糊成一团）
  if (size >= 96) {
    const underW = Math.round(textW * 0.42);
    fillRoundRect(
      Math.round((size - underW) / 2),
      oy + textH + Math.round(size * 0.06),
      Math.round((size - underW) / 2) + underW,
      oy + textH + Math.round(size * 0.06) + Math.max(2, Math.round(size * 0.018)),
      0,
      () => ACCENT,
    );
  }

  return buf;
}

/** 4x 超采样 + 盒式降采样 */
function renderAA(size) {
  const SS = 4;
  const big = render(size * SS);
  const bs = size * SS;
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * bs + (x * SS + sx)) * 4;
          const alpha = big[i + 3];
          r += big[i] * alpha;
          g += big[i + 1] * alpha;
          b += big[i + 2] * alpha;
          a += alpha;
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      if (a === 0) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      } else {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
        out[o + 3] = Math.round(a / n);
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------- PNG 编码 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/** RGBA -> 合法 PNG Buffer */
function encodePng(rgba, width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: truecolor + alpha
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // 每行前置 filter byte 0（None）
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------------------------------------------------- ICO 编码 */

/** RGBA -> ICO 的 32 位 BITMAPINFOHEADER 载荷 */
function encodeIcoImage(rgba, size) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); // biSize
  header.writeInt32LE(size, 4); // biWidth
  header.writeInt32LE(size * 2, 8); // biHeight（XOR + AND 两段）
  header.writeUInt16LE(1, 12); // biPlanes
  header.writeUInt16LE(32, 14); // biBitCount
  header.writeUInt32LE(0, 16); // biCompression = BI_RGB

  // 像素：BGRA，自底向上
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const srcY = size - 1 - y;
    for (let x = 0; x < size; x++) {
      const si = (srcY * size + x) * 4;
      const di = (y * size + x) * 4;
      pixels[di] = rgba[si + 2]; // B
      pixels[di + 1] = rgba[si + 1]; // G
      pixels[di + 2] = rgba[si]; // R
      pixels[di + 3] = rgba[si + 3]; // A
    }
  }

  // AND 掩码：全 0（透明度交给 alpha 通道），每行按 4 字节对齐
  const maskRow = Math.ceil(size / 8);
  const maskStride = (maskRow + 3) & ~3;
  const mask = Buffer.alloc(maskStride * size, 0);

  return Buffer.concat([header, pixels, mask]);
}

function encodeIco(sizes) {
  const images = sizes.map((s) => {
    const rgba = renderAA(s);
    return { size: s, data: encodeIcoImage(rgba, s) };
  });

  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(images.length, 4);

  const entries = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  images.forEach((img, i) => {
    const o = i * 16;
    entries[o] = img.size >= 256 ? 0 : img.size;
    entries[o + 1] = img.size >= 256 ? 0 : img.size;
    entries[o + 2] = 0; // 调色板色数
    entries[o + 3] = 0; // reserved
    entries.writeUInt16LE(1, o + 4); // planes
    entries.writeUInt16LE(32, o + 6); // bit count
    entries.writeUInt32LE(img.data.length, o + 8);
    entries.writeUInt32LE(offset, o + 12);
    offset += img.data.length;
  });

  return Buffer.concat([header, entries, ...images.map((i) => i.data)]);
}

/* -------------------------------------------------------------- 主流程 */

const PNGS = [
  ['icon.png', 512],
  ['128x128@2x.png', 256],
  ['128x128.png', 128],
  ['32x32.png', 32],
];

mkdirSync(OUT_DIR, { recursive: true });

for (const [name, size] of PNGS) {
  const png = encodePng(renderAA(size), size, size);
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`✓ ${name}  ${size}x${size}  ${png.length} bytes`);
}

const ico = encodeIco([16, 32, 48, 256]);
writeFileSync(join(OUT_DIR, 'icon.ico'), ico);
console.log(`✓ icon.ico  16/32/48/256  ${ico.length} bytes`);
