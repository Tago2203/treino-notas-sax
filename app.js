import { LEVELS, getLevel } from './levels.js';
import {
  noteStep,
  noteToMidi,
  noteLabel,
  LETTERS_ORDER,
  NOTE_NAMES_PT,
  NOTE_COLORS,
  DURATION_OPTIONS,
  OCTAVE_OPTIONS,
} from './theory.js';
import { initAudio, playMidiNote } from './audio-engine.js';
import { CANVAS_W, CANVAS_H, STAFF_START_X, render } from './staff-renderer.js';

const STORAGE_PREFIX = 'treino-notas-sax:best:';

const menuScreen = document.getElementById('screen-menu');
const settingsScreen = document.getElementById('screen-settings');
const gameScreen = document.getElementById('screen-game');
const levelListEl = document.getElementById('level-list');
const settingsBackBtn = document.getElementById('settings-back-btn');
const settingsLevelNameEl = document.getElementById('settings-level-name');
const speedRange = document.getElementById('speed-range');
const speedValueEl = document.getElementById('speed-value');
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
const optionsEl = document.getElementById('options');
const canvas = document.getElementById('staff');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

let state = null;
let rafId = null;
let draftLevel = null;

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

function openSettings(levelId) {
  draftLevel = getLevel(levelId);
  settingsLevelNameEl.textContent = draftLevel.label;

  speedRange.value = String(draftLevel.speed);
  speedValueEl.textContent = draftLevel.speed;

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
  return {
    speed: Number(speedRange.value),
    letters,
    octaves,
    durations,
    accidentals: accidentalsCheck.checked,
    spawnInterval: draftLevel.spawnInterval,
  };
}

function validateSettings() {
  const s = readSettings();
  const valid = s.letters.length > 0 && s.octaves.length > 0 && s.durations.length > 0;
  settingsWarningEl.hidden = valid;
  startBtn.disabled = !valid;
  return valid;
}

speedRange.addEventListener('input', () => {
  speedValueEl.textContent = speedRange.value;
});

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

function spawnNote() {
  const data = randomNoteData(state.settings);
  state.notes.push({
    id: state.nextId++,
    ...data,
    x: CANVAS_W - 15,
    judged: null,
    isCurrentTarget: false,
  });
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

function answer(note, correct) {
  if (note.judged !== null) return;
  const midi = noteToMidi(note.letter, note.octave, note.accidental);
  playMidiNote(midi);
  if (correct) {
    note.judged = 'correct';
    state.streak += 1;
    state.score += Math.round(10 * (1 + state.streak * 0.1));
  } else {
    note.judged = 'wrong';
    state.streak = 0;
  }
  disableOptions();
  updateHud();
}

function missNote(note) {
  note.judged = 'missed';
  const midi = noteToMidi(note.letter, note.octave, note.accidental);
  playMidiNote(midi);
  state.streak = 0;
  disableOptions();
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  streakEl.textContent = String(state.streak);
}

function startGame(level, settings) {
  initAudio();
  state = {
    level,
    settings,
    notes: [],
    score: 0,
    streak: 0,
    nextId: 0,
    lastSpawn: settings.spawnInterval,
    lastFrame: performance.now(),
    lastTargetId: null,
  };
  levelNameEl.textContent = level.label;
  updateHud();
  optionsEl.innerHTML = '';
  showScreen('game');
  rafId = requestAnimationFrame(tick);
}

function stopGame() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (state) saveBestScore(state.level.id, state.score);
  state = null;
  showScreen('menu');
  buildMenu();
}

function tick(now) {
  const dt = Math.min((now - state.lastFrame) / 1000, 0.05);
  state.lastFrame = now;
  state.lastSpawn += dt;

  const maxOnScreen = 3;
  if (state.lastSpawn >= state.settings.spawnInterval && state.notes.length < maxOnScreen) {
    spawnNote();
    state.lastSpawn = 0;
  }

  for (const note of state.notes) {
    note.x -= state.settings.speed * dt;
    if (note.judged === null && note.x <= STAFF_START_X + 20) {
      missNote(note);
    }
  }

  const target = currentTarget();
  for (const note of state.notes) {
    note.isCurrentTarget = note === target;
  }
  if (target && target.id !== state.lastTargetId) {
    buildOptions(target);
    state.lastTargetId = target.id;
  }

  state.notes = state.notes.filter((n) => n.x > STAFF_START_X - 60);

  render(ctx, state.notes);

  rafId = requestAnimationFrame(tick);
}

backBtn.addEventListener('click', stopGame);

buildMenu();
