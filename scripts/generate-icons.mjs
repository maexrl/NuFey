import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '../public/icons/icon-source.jpg');
const dest = join(__dirname, '../public/icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

(async () => {
  console.log('Generating PWA icons from source image...');
  for (const size of sizes) {
    await sharp(src)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(join(dest, `icon-${size}x${size}.png`));
    console.log(`  ✓ icon-${size}x${size}.png`);
  }
  console.log('All icons generated!');
})();
