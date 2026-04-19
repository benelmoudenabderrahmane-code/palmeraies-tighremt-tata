/**
 * Copies generated icons to Android mipmap folders + sets brand colors
 * Run: node scripts/setup-android-icons.mjs
 */
import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC  = join(ROOT, 'public', 'logo.png');
const RES  = join(ROOT, 'android', 'app', 'src', 'main', 'res');

const BG = { r: 19, g: 61, b: 32, alpha: 1 };

// Android mipmap sizes
const MIPMAP = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

for (const { dir, size } of MIPMAP) {
  const pad   = Math.round(size * 0.15);
  const inner = size - pad * 2;
  const dest  = join(RES, dir, 'ic_launcher.png');

  await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(dest);
  console.log(`✓ ${dir}/ic_launcher.png (${size}px)`);

  // Round icon (ic_launcher_round)
  const destRound = join(RES, dir, 'ic_launcher_round.png');
  const circle = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
  );
  await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
    .flatten({ background: BG })
    .composite([{ input: circle, blend: 'dest-in' }])
    .png()
    .toFile(destRound);
  console.log(`✓ ${dir}/ic_launcher_round.png`);
}

// Splash screens for each density
const SPLASH = [
  { dir: 'drawable-port-mdpi',    w: 320,  h: 480  },
  { dir: 'drawable-port-hdpi',    w: 480,  h: 800  },
  { dir: 'drawable-port-xhdpi',   w: 720,  h: 1280 },
  { dir: 'drawable-port-xxhdpi',  w: 960,  h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
];

for (const { dir, w, h } of SPLASH) {
  const logoSize = Math.round(Math.min(w, h) * 0.28);
  const dest = join(RES, dir, 'splash.png');

  await sharp(SRC)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top:    Math.round((h - logoSize) / 2),
      bottom: Math.round((h - logoSize) / 2),
      left:   Math.round((w - logoSize) / 2),
      right:  Math.round((w - logoSize) / 2),
      background: BG,
    })
    .flatten({ background: BG })
    .resize(w, h)
    .png()
    .toFile(dest);
  console.log(`✓ ${dir}/splash.png (${w}×${h})`);
}

// Write brand colors to Android colors.xml
const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#133d20</color>
    <color name="colorPrimaryDark">#0d2915</color>
    <color name="colorAccent">#e8a350</color>
    <color name="ic_launcher_background">#133d20</color>
</resources>`;

const valuesDir = join(RES, 'values');
if (!existsSync(valuesDir)) mkdirSync(valuesDir, { recursive: true });
writeFileSync(join(valuesDir, 'colors.xml'), colorsXml);
console.log('✓ values/colors.xml');

console.log('\n✅ Android assets ready!');
