// Copia os arquivos do app (raiz do projeto, servidos pelo GitHub Pages) pra
// www/, que e o webDir usado pelo Capacitor pra empacotar o app Android.
// www/ e sempre gerado por este script, nunca editado a mao.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

const FILES = [
  'index.html',
  'style.css',
  'app.js',
  'theory.js',
  'levels.js',
  'audio-engine.js',
  'staff-renderer.js',
  'manifest.json',
  'service-worker.js',
];

const DIRS = ['icons', 'vendor'];

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

for (const file of FILES) {
  fs.copyFileSync(path.join(ROOT, file), path.join(WWW, file));
}
for (const dir of DIRS) {
  fs.cpSync(path.join(ROOT, dir), path.join(WWW, dir), { recursive: true });
}

console.log('www/ atualizado a partir dos arquivos na raiz do projeto.');
