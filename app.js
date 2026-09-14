import { LEVELS, getLevel } from './levels.js';
import { noteStep, stepToLetterOctave, noteToMidi, noteLabel, LETTERS_ORDER } from './theory.js';
import { initAudio, playMidiNote } from './audio-engine.js';
import { CANVAS_W, CANVAS_H, STAFF_START_X, render } from './staff-renderer.js';

const STORAGE_PREFIX = 'treino-notas-sax:best:';

const menuScreen = document.getElementById('screen-menu');
const gameScreen = document.getElementById('screen-game');
const levelListEl = document.getElementById('level-list');
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

function bestScore(levelId) {
  return Number(localStorage.getItem(STORAGE_PREFIX + levelId) || 0);
}

function saveBestScore(levelId, score) {
  if (score > bestScore(levelId)) {
    localStorage.setItem(STORAGE_PREFIX + levelId, String(score));
  }
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
    btn.addEventListener('click', () => startLevel(level.id));
    levelListEl.appendChild(btn);
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNoteData(level) {
  const step = randInt(level.minStep, level.maxStep);
  let accidental = 0;
  if (!level.naturalsOnly) {
    const r = Math.random();
    if (r < 0.22) accidental = 1;
    else if (r < 0.4) accidental = -1;
  }
  const { letter, octave } = stepToLetterOctave(step);
  return { step, accidental, letter, octave };
}

function spawnNote() {
  const data = randomNoteData(state.level);
  state.notes.push({
    id: state.nextId++,
    ...data,
    x: CANVAS_W - 15,
    judged: null,
    isCurrentTarget: false,
    removeAt: null,
  });
}

function currentTarget() {
  return state.notes.find((n) => n.judged === null) || null;
}

function buildOptions(target) {
  optionsEl.innerHTML = '';
  const correctLabel = noteLabel(target.letter, target.accidental);
  const otherLetters = LETTERS_ORDER.filter((l) => l !== target.letter);
  shuffle(otherLetters);
  const distractors = otherLetters.slice(0, Math.max(0, state.level.optionsCount - 1));
  const options = shuffle([
    { label: correctLabel, correct: true },
    ...distractors.map((l) => ({ label: noteLabel(l, 0), correct: false })),
  ]);

  for (const opt of options) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => answer(target, opt.correct));
    optionsEl.appendChild(btn);
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
  optionsEl.innerHTML = '';
  updateHud();
}

function missNote(note) {
  note.judged = 'missed';
  const midi = noteToMidi(note.letter, note.octave, note.accidental);
  playMidiNote(midi);
  state.streak = 0;
  optionsEl.innerHTML = '';
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  streakEl.textContent = String(state.streak);
}

function startLevel(levelId) {
  const level = getLevel(levelId);
  initAudio();
  state = {
    level,
    notes: [],
    score: 0,
    streak: 0,
    nextId: 0,
    lastSpawn: level.spawnInterval, // spawna a primeira nota já no primeiro frame
    lastFrame: performance.now(),
  };
  levelNameEl.textContent = level.label;
  updateHud();
  optionsEl.innerHTML = '';
  menuScreen.hidden = true;
  gameScreen.hidden = false;
  rafId = requestAnimationFrame(tick);
}

function stopLevel() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (state) saveBestScore(state.level.id, state.score);
  state = null;
  gameScreen.hidden = true;
  menuScreen.hidden = false;
  buildMenu();
}

function tick(now) {
  const dt = Math.min((now - state.lastFrame) / 1000, 0.05);
  state.lastFrame = now;
  state.lastSpawn += dt;

  const maxOnScreen = 3;
  if (state.lastSpawn >= state.level.spawnInterval && state.notes.length < maxOnScreen) {
    spawnNote();
    state.lastSpawn = 0;
  }

  for (const note of state.notes) {
    note.x -= state.level.speed * dt;
    if (note.judged === null && note.x <= STAFF_START_X + 20) {
      missNote(note);
    }
  }

  const target = currentTarget();
  for (const note of state.notes) {
    note.isCurrentTarget = note === target;
  }
  if (target && optionsEl.childElementCount === 0) {
    buildOptions(target);
  }

  state.notes = state.notes.filter((n) => n.x > STAFF_START_X - 60);

  render(ctx, state.notes);

  rafId = requestAnimationFrame(tick);
}

backBtn.addEventListener('click', stopLevel);

buildMenu();
