// Presets de dificuldade. Cada um só preenche valores padrão pra tela de
// configurações — o usuário pode ajustar tudo (velocidade, notas, oitavas,
// ritmos, acidentes) antes de começar.

const ALL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const LEVELS = [
  {
    id: 'iniciante',
    label: 'Iniciante',
    description: 'Uma oitava, ritmo simples',
    mode: 'scroll',
    speed: 20,
    spawnInterval: 1.3,
    letters: [...ALL_LETTERS],
    octaves: [4],
    durations: ['seminima'],
    accidentals: false,
  },
  {
    id: 'basico',
    label: 'Básico',
    description: 'Mesma faixa, mais rápido',
    mode: 'scroll',
    speed: 50,
    spawnInterval: 1,
    letters: [...ALL_LETTERS],
    octaves: [4],
    durations: ['seminima', 'minima'],
    accidentals: false,
  },
  {
    id: 'intermediario',
    label: 'Intermediário',
    description: 'Duas oitavas, mais rápido',
    mode: 'scroll',
    speed: 100,
    spawnInterval: 0.8,
    letters: [...ALL_LETTERS],
    octaves: [4, 5],
    durations: ['seminima', 'minima'],
    accidentals: false,
  },
  {
    id: 'avancado',
    label: 'Avançado',
    description: 'Faixa ampla, mais rápido e com acidentes',
    mode: 'scroll',
    speed: 130,
    spawnInterval: 0.5,
    letters: [...ALL_LETTERS],
    octaves: [3, 4, 5, 6],
    durations: ['seminima', 'minima'],
    accidentals: true,
  },
  {
    id: 'personalizado',
    label: 'Personalizado',
    description: 'Ajuste tudo do seu jeito',
    mode: 'scroll',
    speed: 50,
    spawnInterval: 0.8,
    letters: [...ALL_LETTERS],
    octaves: [4, 5],
    durations: ['seminima'],
    accidentals: false,
  },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id);
}
