import { LEVELS, getLevel } from './levels.js';
import {
  noteStep,
  noteToMidi,
  LETTERS_ORDER,
  NOTE_NAMES_PT,
  NOTE_COLORS,
  DURATION_OPTIONS,
  OCTAVE_OPTIONS,
  SPEED_OPTIONS,
  SPACING_OPTIONS,
} from './theory.js';
import { initAudio, playMidiNote, playErrorSound, setMuted, isMuted } from './audio-engine.js';
import { CANVAS_W, ZOOM, STAFF_START_X, render, layoutXPositions } from './staff-renderer.js';

const STORAGE_PREFIX = 'treino-notas-sax:best:';
const MUTE_STORAGE_KEY = 'treino-notas-sax:muted';

// A velocidade sobe a cada acerto e volta pro valor base ao errar.
const RAMP_STEP = 10;
const RAMP_MAX = 260;

const MODES = [
  { id: 'scroll', label: '🎬 Notas passando', description: 'As notas se movem pela pauta' },
  { id: 'ramp', label: '📈 Crescente', description: 'Acerta pra acelerar; errar reinicia a velocidade' },
  { id: 'fixed5', label: '5️⃣ Sequência de 5', description: '5 notas fixas, responda em ordem' },
  { id: 'single', label: '🎯 Nota única', description: 'Uma nota por vez, sem pressa' },
];

function formatSpacingLabel(v) {
  return `${String(v).replace('.', ',')} s`;
}

const menuScreen = document.getElementById('screen-menu');
const settingsScreen = document.getElementById('screen-settings');
const gameScreen = document.getElementById('screen-game');
const levelListEl = document.getElementById('level-list');
const settingsBackBtn = document.getElementById('settings-back-btn');
const settingsLevelNameEl = document.getElementById('settings-level-name');
const modeTogglesEl = document.getElementById('mode-toggles');
const speedBlock = document.getElementById('speed-block');
const speedTogglesEl = document.getElementById('speed-toggles');
const spacingBlock = document.getElementById('spacing-block');
const spacingTogglesEl = document.getElementById('spacing-toggles');
const noteTogglesEl = document.getElementById('note-toggles');
const octaveTogglesEl = document.getElementById('octave-toggles');
const durationTogglesEl = document.getElementById('duration-toggles');
const accidentalsCheck = document.getElementById('accidentals-check');
const settingsWarningEl = document.getElementById('settings-warning');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const levelNameEl = document.getElementById('level-name');
const rampSpeedStatEl = document.getElementById('ramp-speed-stat');
const rampSpeedEl = document.getElementById('ramp-speed');
const muteBtn = document.getElementById('mute-btn');
const gameControlsEl = document.getElementById('game-controls');
const gameSpeedSelect = document.getElementById('game-speed-select');
const gameSpacingSelect = document.getElementById('game-spacing-select');
const optionsEl = document.getElementById('options');
const canvas = document.getElementById('staff');
const ctx = canvas.getContext('2d');

gameSpeedSelect.innerHTML = SPEED_OPTIONS.map((v) => `<option value="${v}">${v} px/s</option>`).join('');
gameSpacingSelect.innerHTML = SPACING_OPTIONS.map((v) => `<option value="${v}">${formatSpacingLabel(v)}</option>`).join('');

function applyMuteUI(muted) {
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-label', muted ? 'Ativar som' : 'Mutar som');
}

setMuted(localStorage.getItem(MUTE_STORAGE_KEY) === '1');
applyMuteUI(isMuted());

muteBtn.addEventListener('click', () => {
  const next = !isMuted();
  setMuted(next);
  localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
  applyMuteUI(next);
});

gameSpeedSelect.addEventListener('change', () => {
  if (!state) return;
  const v = Number(gameSpeedSelect.value);
  state.settings.speed = v;
  if (state.mode === 'ramp') state.rampSpeed = v;
});

gameSpacingSelect.addEventListener('change', () => {
  if (!state) return;
  state.settings.spawnInterval = Number(gameSpacingSelect.value);
});

// Dimensiona o canvas com a resolução física real da tela (considerando a
// densidade de pixels do aparelho) multiplicada pelo zoom desejado, pra
// pauta ficar grande E nítida, em vez de esticar uma imagem pequena.
function fitCanvasResolution() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(rect.width * dpr * ZOOM);
  const height = Math.round(rect.height * dpr * ZOOM);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

window.addEventListener('resize', () => {
  if (!gameScreen.hidden) fitCanvasResolution();
});

let state = null;
let rafId = null;
let draftLevel = null;
let draftMode = 'scroll';

function bestScore(levelId) {
  return Number(localStorage.getItem(STORAGE_PREFIX + levelId) || 0);
}

function saveBestScore(levelId, score) {
  if (score > bestScore(levelId)) {
    localStorage.setItem(STORAGE_PREFIX + levelId, String(score));
  }
}

function showScreen(name) {
  menuScreen.hidden = name !== 'menu';
  settingsScreen.hidden = name !== 'settings';
  gameScreen.hidden = name !== 'game';
}

function buildMenu() {
  levelListEl.innerHTML = '';
  for (const level of LEVELS) {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.innerHTML = `
      <span class="level-btn-title">${level.label}</span>
      <span class="level-btn-desc">${level.description}</span>
      <span class="level-btn-best">Melhor: ${bestScore(level.id)}</span>
    `;
    btn.addEventListener('click', () => openSettings(level.id));
    levelListEl.appendChild(btn);
  }
}

// --- Tela de configurações ---

function updateModeDependentVisibility() {
  const showSpeedSpacing = draftMode === 'scroll' || draftMode === 'ramp';
  speedBlock.hidden = !showSpeedSpacing;
  spacingBlock.hidden = !showSpeedSpacing;
}

// Grupo de "chips" de seleção única (visual igual às caixinhas de Oitavas,
// mas com comportamento de rádio: só uma opção fica marcada por vez).
function buildSingleSelectChips(container, items, currentValue, onSelect) {
  container.innerHTML = '';
  for (const item of items) {
    const active = item.value === currentValue;
    const label = document.createElement('label');
    label.className = 'chip selectable' + (active ? ' selected' : '');
    if (item.title) label.title = item.title;
    label.innerHTML = `<input type="radio" name="${container.id}" value="${item.value}" ${active ? 'checked' : ''} style="display:none" />${item.label}`;
    label.querySelector('input').addEventListener('change', () => {
      container.querySelectorAll('.chip').forEach((c) => c.classList.remove('selected'));
      label.classList.add('selected');
      onSelect(item.value);
    });
    container.appendChild(label);
  }
}

function openSettings(levelId) {
  draftLevel = getLevel(levelId);
  draftMode = draftLevel.mode;
  settingsLevelNameEl.textContent = draftLevel.label;

  buildSingleSelectChips(
    modeTogglesEl,
    MODES.map((m) => ({ value: m.id, label: m.label, title: m.description })),
    draftMode,
    (value) => {
      draftMode = value;
      updateModeDependentVisibility();
    }
  );

  buildSingleSelectChips(
    speedTogglesEl,
    SPEED_OPTIONS.map((v) => ({ value: String(v), label: `${v} px/s` })),
    String(draftLevel.speed),
    () => {}
  );

  buildSingleSelectChips(
    spacingTogglesEl,
    SPACING_OPTIONS.map((v) => ({ value: String(v), label: formatSpacingLabel(v) })),
    String(draftLevel.spawnInterval),
    () => {}
  );

  updateModeDependentVisibility();

  noteTogglesEl.innerHTML = '';
  for (const letter of LETTERS_ORDER) {
    const active = draftLevel.letters.includes(letter);
    const colors = NOTE_COLORS[letter];
    const label = document.createElement('label');
    label.className = 'note-chip' + (active ? ' active' : '');
    label.style.background = colors.bg;
    label.style.color = colors.fg;
    label.innerHTML = `<input type="checkbox" value="${letter}" ${active ? 'checked' : ''}/>${NOTE_NAMES_PT[letter]}`;
    const input = label.querySelector('input');
    input.addEventListener('change', () => {
      label.classList.toggle('active', input.checked);
      validateSettings();
    });
    noteTogglesEl.appendChild(label);
  }

  octaveTogglesEl.innerHTML = '';
  for (const octave of OCTAVE_OPTIONS) {
    const active = draftLevel.octaves.includes(octave);
    const label = document.createElement('label');
    label.className = 'chip';
    label.innerHTML = `<input type="checkbox" value="${octave}" ${active ? 'checked' : ''}/>Oitava ${octave}`;
    label.querySelector('input').addEventListener('change', validateSettings);
    octaveTogglesEl.appendChild(label);
  }

  durationTogglesEl.innerHTML = '';
  for (const dur of DURATION_OPTIONS) {
    const active = draftLevel.durations.includes(dur.id);
    const label = document.createElement('label');
    label.className = 'chip';
    label.innerHTML = `<input type="checkbox" value="${dur.id}" ${active ? 'checked' : ''}/>${dur.label}`;
    label.querySelector('input').addEventListener('change', validateSettings);
    durationTogglesEl.appendChild(label);
  }

  accidentalsCheck.checked = draftLevel.accidentals;

  validateSettings();
  showScreen('settings');
}

function readSettings() {
  const letters = [...noteTogglesEl.querySelectorAll('input:checked')].map((i) => i.value);
  const octaves = [...octaveTogglesEl.querySelectorAll('input:checked')].map((i) => Number(i.value));
  const durations = [...durationTogglesEl.querySelectorAll('input:checked')].map((i) => i.value);
  const speedInput = speedTogglesEl.querySelector('input:checked');
  const spacingInput = spacingTogglesEl.querySelector('input:checked');
  return {
    mode: draftMode,
    speed: Number(speedInput.value),
    spawnInterval: Number(spacingInput.value),
    letters,
    octaves,
    durations,
    accidentals: accidentalsCheck.checked,
  };
}

function validateSettings() {
  const s = readSettings();
  const valid = s.letters.length > 0 && s.octaves.length > 0 && s.durations.length > 0;
  settingsWarningEl.hidden = valid;
  startBtn.disabled = !valid;
  return valid;
}

settingsBackBtn.addEventListener('click', () => {
  showScreen('menu');
  buildMenu();
});

startBtn.addEventListener('click', () => {
  if (!validateSettings()) return;
  startGame(draftLevel, readSettings());
});

// --- Jogo ---

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function randomNoteData(settings) {
  const letter = pickRandom(settings.letters);
  const octave = pickRandom(settings.octaves);
  const step = noteStep(letter, octave);
  let accidental = 0;
  if (settings.accidentals) {
    const r = Math.random();
    if (r < 0.22) accidental = 1;
    else if (r < 0.4) accidental = -1;
  }
  const duration = pickRandom(settings.durations);
  return { step, accidental, letter, octave, duration };
}

function currentTarget() {
  return state.notes.find((n) => n.judged === null) || null;
}

function buildOptions(target) {
  optionsEl.innerHTML = '';
  for (const letter of LETTERS_ORDER) {
    const colors = NOTE_COLORS[letter];
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.style.background = colors.bg;
    btn.style.color = colors.fg;
    btn.textContent = NOTE_NAMES_PT[letter];
    btn.addEventListener('click', () => answer(target, letter === target.letter));
    optionsEl.appendChild(btn);
  }
}

function disableOptions() {
  optionsEl.querySelectorAll('.option-btn').forEach((b) => { b.disabled = true; });
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  streakEl.textContent = String(state.streak);
}

function refreshTargetAndOptions() {
  const target = currentTarget();
  for (const note of state.notes) {
    note.isCurrentTarget = note === target;
  }
  if (target && target.id !== state.lastTargetId) {
    buildOptions(target);
    state.lastTargetId = target.id;
  }
  render(ctx, state.notes, state.mode === 'scroll' || state.mode === 'ramp');
}

function scheduleTimeout(fn, delay) {
  state.pendingTimeout = setTimeout(() => {
    state.pendingTimeout = null;
    fn();
  }, delay);
}

// modo "scroll": notas nascem e se movem continuamente
function spawnScrollNote() {
  const data = randomNoteData(state.settings);
  state.notes.push({
    id: state.nextId++,
    ...data,
    x: CANVAS_W - 15,
    judged: null,
    isCurrentTarget: false,
  });
}

function missNote(note) {
  note.judged = 'missed';
  playErrorSound();
  const midi = noteToMidi(note.letter, note.octave, note.accidental);
  playMidiNote(midi);
  state.streak = 0;
  if (state.mode === 'ramp') state.rampSpeed = state.settings.speed;
  disableOptions();
  updateHud();
}

function tick(now) {
  const dt = Math.min((now - state.lastFrame) / 1000, 0.05);
  state.lastFrame = now;
  state.lastSpawn += dt;

  if (state.lastSpawn >= state.settings.spawnInterval) {
    spawnScrollNote();
    state.lastSpawn = 0;
  }

  const speed = state.mode === 'ramp' ? state.rampSpeed : state.settings.speed;
  for (const note of state.notes) {
    note.x -= speed * dt;
    if (note.judged === null && note.x <= STAFF_START_X + 20) {
      missNote(note);
    }
  }

  state.notes = state.notes.filter((n) => n.x > STAFF_START_X - 60);
  if (state.mode === 'ramp') rampSpeedEl.textContent = String(Math.round(state.rampSpeed));
  refreshTargetAndOptions();

  rafId = requestAnimationFrame(tick);
}

// modo "fixed5": 5 notas estáticas por vez, respondidas em sequência
function spawnFixed5Batch() {
  const xs = layoutXPositions(5);
  state.notes = xs.map((x) => {
    const data = randomNoteData(state.settings);
    return { id: state.nextId++, ...data, x, judged: null, isCurrentTarget: false };
  });
  state.lastTargetId = null;
  refreshTargetAndOptions();
}

// modo "single": uma nota estática por vez
function spawnSingleNote() {
  const data = randomNoteData(state.settings);
  const [x] = layoutXPositions(1);
  state.notes = [{ id: state.nextId++, ...data, x, judged: null, isCurrentTarget: false }];
  state.lastTargetId = null;
  refreshTargetAndOptions();
}

function answer(note, correct) {
  if (note.judged !== null) return;
  if (!correct) playErrorSound();
  const midi = noteToMidi(note.letter, note.octave, note.accidental);
  playMidiNote(midi);
  note.judged = correct ? 'correct' : 'wrong';
  if (correct) {
    state.streak += 1;
    state.score += Math.round(10 * (1 + state.streak * 0.1));
    if (state.mode === 'ramp') state.rampSpeed = Math.min(state.rampSpeed + RAMP_STEP, RAMP_MAX);
  } else {
    state.streak = 0;
    if (state.mode === 'ramp') state.rampSpeed = state.settings.speed;
  }
  disableOptions();
  updateHud();

  if (state.mode === 'scroll' || state.mode === 'ramp') return; // o loop de animação cuida do resto

  render(ctx, state.notes, false);
  if (state.mode === 'single') {
    scheduleTimeout(spawnSingleNote, 700);
  } else {
    const hasNext = state.notes.some((n) => n.judged === null);
    if (hasNext) {
      scheduleTimeout(refreshTargetAndOptions, 250);
    } else {
      scheduleTimeout(spawnFixed5Batch, 900);
    }
  }
}

function tryLockLandscape() {
  const orientation = screen.orientation;
  if (orientation && orientation.lock) {
    orientation.lock('landscape').catch(() => {});
  }
}

function startGame(level, settings) {
  initAudio();
  tryLockLandscape();
  state = {
    level,
    settings,
    mode: settings.mode,
    notes: [],
    score: 0,
    streak: 0,
    rampSpeed: settings.speed,
    nextId: 0,
    lastSpawn: settings.spawnInterval,
    lastFrame: performance.now(),
    lastTargetId: null,
    pendingTimeout: null,
  };
  levelNameEl.textContent = level.label;
  updateHud();
  optionsEl.innerHTML = '';
  showScreen('game');

  const showLiveControls = state.mode === 'scroll' || state.mode === 'ramp';
  gameControlsEl.hidden = !showLiveControls;
  rampSpeedStatEl.hidden = state.mode !== 'ramp';
  if (showLiveControls) {
    gameSpeedSelect.value = String(settings.speed);
    gameSpacingSelect.value = String(settings.spawnInterval);
  }
  if (state.mode === 'ramp') rampSpeedEl.textContent = String(Math.round(state.rampSpeed));

  if (showLiveControls) {
    rafId = requestAnimationFrame(tick);
  } else if (state.mode === 'fixed5') {
    spawnFixed5Batch();
  } else {
    spawnSingleNote();
  }

  // espera os botões de resposta existirem (mudam a altura disponível pra
  // pauta) e o layout se estabilizar antes de medir o tamanho real da tela.
  requestAnimationFrame(() => requestAnimationFrame(fitCanvasResolution));
}

function stopGame() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (state && state.pendingTimeout) clearTimeout(state.pendingTimeout);
  if (state) saveBestScore(state.level.id, state.score);
  state = null;
  showScreen('menu');
  buildMenu();
}

backBtn.addEventListener('click', stopGame);

buildMenu();
