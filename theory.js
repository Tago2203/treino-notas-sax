// Utilitários de teoria musical: posição na pauta (clave de sol) <-> nota <-> MIDI.
// step 0 = Mi4 (linha de baixo da pauta). Cada linha/espaço = 1 step.

export const LETTER_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
export const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const NOTE_NAMES_PT = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };
export const LETTERS_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const STEP_OFFSET = 30; // (4*7 + 2) para Mi4 = step 0

export function noteStep(letter, octave) {
  return octave * 7 + LETTER_INDEX[letter] - STEP_OFFSET;
}

export function stepToLetterOctave(step) {
  const absIndex = step + STEP_OFFSET;
  const octave = Math.floor(absIndex / 7);
  const letterIdx = ((absIndex % 7) + 7) % 7;
  const letter = LETTERS_ORDER.find((l) => LETTER_INDEX[l] === letterIdx);
  return { letter, octave };
}

export function noteToMidi(letter, octave, accidental = 0) {
  return (octave + 1) * 12 + SEMITONES[letter] + accidental;
}

export function noteLabel(letter, accidental = 0) {
  const base = NOTE_NAMES_PT[letter];
  if (accidental === 1) return base + '#';
  if (accidental === -1) return base + 'b';
  return base;
}

// Cores vibrantes fixas por nota (estilo Boomwhackers), usadas nos botões de resposta.
// Texto sempre preto e negrito (aplicado no CSS), só o fundo muda por nota.
export const NOTE_COLORS = {
  C: { bg: '#e63946', fg: '#000000' },
  D: { bg: '#f3722c', fg: '#000000' },
  E: { bg: '#f9c74f', fg: '#000000' },
  F: { bg: '#43aa8b', fg: '#000000' },
  G: { bg: '#277da1', fg: '#000000' },
  A: { bg: '#5e60ce', fg: '#000000' },
  B: { bg: '#d63384', fg: '#000000' },
};

export const DURATION_OPTIONS = [
  { id: 'seminima', label: 'Semínima' },
  { id: 'minima', label: 'Mínima' },
];

export const OCTAVE_OPTIONS = [3, 4, 5, 6];

