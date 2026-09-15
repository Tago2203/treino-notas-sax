// Toca o som real de saxofone alto via WebAudioFont (carregado por <script> no index.html).
// https://github.com/surikov/webaudiofont

const PRESET_VAR = '_tone_0650_Aspirin_sf2_file';

let audioContext = null;
let player = null;

function ensureContext() {
  if (!audioContext) {
    const AudioContextFunc = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextFunc();
    player = new window.WebAudioFontPlayer();
    player.loader.decodeAfterLoading(audioContext, PRESET_VAR);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// Precisa ser chamado a partir de um gesto do usuário (clique/toque) por causa
// das políticas de autoplay dos navegadores.
export function initAudio() {
  ensureContext();
}

export function isAudioReady() {
  return Boolean(window[PRESET_VAR]);
}

export function playMidiNote(midiNumber, duration = 1.3) {
  ensureContext();
  const preset = window[PRESET_VAR];
  if (!preset || !player) return;
  player.queueWaveTable(audioContext, audioContext.destination, preset, 0, midiNumber, duration);
}

// Bipe curto de erro (dois tons descendentes), sem depender do WebAudioFont.
export function playErrorSound() {
  ensureContext();
  const t0 = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
  gain.connect(audioContext.destination);

  const osc = audioContext.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, t0);
  osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.22);
  osc.connect(gain);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
  osc.start(t0);
  osc.stop(t0 + 0.25);
}
