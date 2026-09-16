// Redimensiona os screenshots brutos pra um canvas fixo 1600x900 (16:9),
// dentro dos limites da Play Store (razão máx. 2:1, PNG 24-bit sem alpha).
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'store-assets', 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SRC_DIR = process.argv[2];
if (!SRC_DIR) {
  console.error('Uso: node process-screenshots.js <pasta-com-screenshots-brutos>');
  process.exit(1);
}

const FILES = [
  { src: 'screenshot-1789575070490-0.jpg', out: '1-menu.png' },
  { src: 'screenshot-1789575080099-1.jpg', out: '2-configuracoes.png' },
  { src: 'screenshot-1789575095034-2.jpg', out: '3-jogo-notas-passando.png' },
  { src: 'screenshot-1789575132170-4.jpg', out: '4-modo-crescente.png' },
  { src: 'screenshot-1789575190066-5.jpg', out: '5-nota-unica.png' },
];

const W = 1600;
const H = 900;
const BG = '#fbf6ee';

async function main() {
  for (const { src, out } of FILES) {
    const inputPath = path.join(SRC_DIR, src);
    await sharp(inputPath)
      .resize(W, H, { fit: 'contain', background: BG })
      .flatten({ background: BG })
      .png()
      .toFile(path.join(OUT_DIR, out));
    console.log('gerado:', out);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
