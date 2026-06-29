// One-time generator for the Enamelware placeholder hero image.
// Run with: node scripts/gen-placeholder.mjs
// Output is committed as a static asset; this script is NOT part of the build.
// sharp writes no EXIF/metadata by default, so the output is privacy-clean.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1600;
const H = 1067;
const cx = W / 2;
const cy = H / 2;

const cream = '#F7EFE0';
const sand = '#EFE3CD';
const teal = '#1E8E8E';
const tomato = '#D8412F';
const butter = '#F2C14E';
const steel = '#211C18';

// Subtle checkerboard backsplash (sand tiles on cream).
const t = 80;
let tiles = '';
for (let y = 0; y < H; y += t) {
  for (let x = 0; x < W; x += t) {
    if ((x / t + y / t) % 2 === 0) {
      tiles += `<rect x="${x}" y="${y}" width="${t}" height="${t}" fill="${sand}" opacity="0.5"/>`;
    }
  }
}

// Cathrineholm-style lotus: 8 teardrop petals, alternating teal/tomato.
let petals = '';
for (let i = 0; i < 8; i++) {
  const fill = i % 2 === 0 ? teal : tomato;
  petals += `<ellipse cx="${cx}" cy="${cy - 150}" rx="90" ry="230" fill="${fill}" opacity="0.92" transform="rotate(${i * 45} ${cx} ${cy})"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${cream}"/>
  ${tiles}
  <g>${petals}</g>
  <circle cx="${cx}" cy="${cy}" r="120" fill="${butter}"/>
  <circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="${steel}" stroke-width="8"/>
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="26" fill="none" stroke="${steel}" stroke-width="10"/>
</svg>`;

await mkdir('recipes/images/grandmas-apple-pie', { recursive: true });
await sharp(Buffer.from(svg))
  .jpeg({ quality: 82 })
  .toFile('recipes/images/grandmas-apple-pie/hero.jpg');

console.log('Wrote recipes/images/grandmas-apple-pie/hero.jpg');
