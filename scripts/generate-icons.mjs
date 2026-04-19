/**
 * Generates all PWA + Capacitor app icons from public/logo.png
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dirname, '..');
const SRC    = join(ROOT, 'public', 'logo.png');
const OUTDIR = join(ROOT, 'public', 'icons');

if (!existsSync(OUTDIR)) mkdirSync(OUTDIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Green background matching the brand
const BG = { r: 19, g: 61, b: 32, alpha: 1 };

for (const size of SIZES) {
  const pad    = Math.round(size * 0.15);          // 15% padding
  const inner  = size - pad * 2;

  await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(join(OUTDIR, `icon-${size}.png`));

  console.log(`✓ icon-${size}.png`);
}

// Also generate a splash screen (2048×2048) for Android / iOS
const splashDir = join(ROOT, 'public', 'splash');
if (!existsSync(splashDir)) mkdirSync(splashDir, { recursive: true });

await sharp(SRC)
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 768, bottom: 768, left: 768, right: 768, background: BG })
  .flatten({ background: BG })
  .png()
  .toFile(join(splashDir, 'splash.png'));
console.log('✓ splash/splash.png (2048×2048)');

console.log('\nAll icons generated successfully!');
