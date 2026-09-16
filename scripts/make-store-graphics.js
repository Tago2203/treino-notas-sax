// Gera a feature graphic (1024x500) da Play Store a partir do icone do app.
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ICON = path.join(ROOT, 'icons', 'icon-512.png');
const OUT_DIR = path.join(ROOT, 'store-assets');
const fs = require('fs');
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 1024;
const H = 500;
const BG = '#e07a3f';

async function main() {
  const iconSize = 380;
  const iconBuf = await sharp(ICON).resize(iconSize, iconSize).toBuffer();

  const svgText = `
    <svg width="${W}" height="${H}">
      <style>
        .title { fill: #ffffff; font-size: 72px; font-weight: 700; font-family: Arial, sans-serif; }
        .subtitle { fill: #fff3e9; font-size: 30px; font-family: Arial, sans-serif; }
      </style>
      <text x="460" y="230" class="title">Treino de Notas</text>
      <text x="460" y="280" class="subtitle">Leitura de partitura na clave de sol</text>
    </svg>
  `;

  await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  })
    .composite([
      { input: iconBuf, left: 40, top: Math.round((H - iconSize) / 2) },
      { input: Buffer.from(svgText), left: 0, top: 0 },
    ])
    .png()
    .toFile(path.join(OUT_DIR, 'feature-graphic.png'));

  console.log('store-assets/feature-graphic.png gerado (1024x500).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
