import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import omggif from 'omggif';
import quantize from 'quantize';

const { GifWriter } = omggif;

const TARGET_W = 800;
const TARGET_H = 500;
const ROOT = process.cwd();

const slides = [
  { file: 'docs/media/hero.jpg', label: '1. Instant URL Telemetry & Audit' },
  { file: 'docs/media/report-overview.jpg', label: '2. Real-Time Category Breakdown (98/100)' },
  { file: 'docs/media/report-fix.jpg', label: '3. Actionable Ranked Fixes & Code Diffs' },
  { file: 'docs/media/dashboard.jpg', label: '4. Mission Control Team Dashboard' },
  { file: 'docs/media/compare.jpg', label: '5. Side-by-Side Competitor Benchmarking' },
];

function resizeAndCrop(raw, srcW, srcH, dstW, dstH) {
  const out = new Uint8Array(dstW * dstH * 4);
  const scale = dstW / srcW;
  
  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.min(srcW - 1, Math.floor(dx / scale));
      const sy = Math.min(srcH - 1, Math.floor(dy / scale));
      const srcIdx = (sy * srcW + sx) * 4;
      const dstIdx = (dy * dstW + dx) * 4;
      out[dstIdx] = raw[srcIdx];
      out[dstIdx + 1] = raw[srcIdx + 1];
      out[dstIdx + 2] = raw[srcIdx + 2];
      out[dstIdx + 3] = 255;
    }
  }
  return out;
}

const frames = [];

for (const s of slides) {
  const fullPath = path.join(ROOT, s.file);
  console.log(`Loading ${s.file}...`);
  const buf = fs.readFileSync(fullPath);
  const decoded = jpeg.decode(buf, { useTArray: true });
  const resized = resizeAndCrop(decoded.data, decoded.width, decoded.height, TARGET_W, TARGET_H);
  frames.push({ rgba: resized, label: s.label });
}

const gifBuffer = Buffer.alloc(TARGET_W * TARGET_H * (frames.length + 1) * 2);
const gifWriter = new GifWriter(gifBuffer, TARGET_W, TARGET_H, { loop: 0 });

for (let i = 0; i < frames.length; i++) {
  console.log(`Quantizing frame ${i + 1}/${frames.length}: ${frames[i].label}...`);
  const rgba = frames[i].rgba;
  
  const pixelArray = [];
  const step = 4 * 6;
  for (let p = 0; p < rgba.length; p += step) {
    pixelArray.push([rgba[p], rgba[p + 1], rgba[p + 2]]);
  }
  
  const colorMap = quantize(pixelArray, 256);
  const palette = colorMap.palette();
  
  const intPalette = palette.map(([r, g, b]) => (r << 16) | (g << 8) | b);
  while (intPalette.length < 256) intPalette.push(0);

  const cache = new Int16Array(32768).fill(-1);

  const indexed = new Uint8Array(TARGET_W * TARGET_H);
  for (let p = 0, idx = 0; p < rgba.length; p += 4, idx++) {
    const r = rgba[p];
    const g = rgba[p + 1];
    const b = rgba[p + 2];
    const colorKey = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    
    let found = cache[colorKey];
    if (found === -1) {
      const nearest = colorMap.map([r, g, b]);
      for (let c = 0; c < palette.length; c++) {
        if (palette[c][0] === nearest[0] && palette[c][1] === nearest[1] && palette[c][2] === nearest[2]) {
          found = c;
          break;
        }
      }
      if (found === -1) found = 0;
      cache[colorKey] = found;
    }
    indexed[idx] = found;
  }

  // 2.6 seconds per slide
  gifWriter.addFrame(0, 0, TARGET_W, TARGET_H, indexed, {
    palette: intPalette,
    delay: 260,
  });
}

const finalSize = gifWriter.end();
const outGif = gifBuffer.subarray(0, finalSize);
const dest = path.join(ROOT, 'docs/media/orbital-showcase.gif');
fs.writeFileSync(dest, outGif);
console.log(`Generated ${dest} (${(finalSize / 1024 / 1024).toFixed(2)} MB)`);
