// Configuração dos níveis de dificuldade.
// minStep/maxStep em "steps" da pauta (ver theory.js), step 0 = Mi4 (linha de baixo).

export const LEVELS = [
  {
    id: 'iniciante',
    label: 'Iniciante',
    description: 'Notas dentro da pauta (Mi4–Fá5)',
    minStep: 0,
    maxStep: 8,
    naturalsOnly: true,
    speed: 55, // px/seg
    optionsCount: 4,
    spawnInterval: 3.2, // seg entre notas
    answerWindow: 3.0, // seg pra responder após a nota nascer
  },
  {
    id: 'basico',
    label: 'Básico',
    description: 'Mesma faixa, mais rápido',
    minStep: 0,
    maxStep: 8,
    naturalsOnly: true,
    speed: 85,
    optionsCount: 5,
    spawnInterval: 2.4,
    answerWindow: 2.2,
  },
  {
    id: 'intermediario',
    label: 'Intermediário',
    description: 'Com linhas suplementares (Dó4–Lá5)',
    minStep: -2,
    maxStep: 10,
    naturalsOnly: true,
    speed: 105,
    optionsCount: 6,
    spawnInterval: 2.0,
    answerWindow: 1.9,
  },
  {
    id: 'avancado',
    label: 'Avançado',
    description: 'Faixa ampla, com sustenidos e bemóis',
    minStep: -6,
    maxStep: 14,
    naturalsOnly: false,
    speed: 130,
    optionsCount: 7,
    spawnInterval: 1.7,
    answerWindow: 1.6,
  },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id);
}
