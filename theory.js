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
