// Presets de dificuldade. Cada um só preenche valores padrão pra tela de
// configurações — o usuário pode ajustar tudo (velocidade, notas, oitavas,
// ritmos, acidentes) antes de começar.

const ALL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const LEVELS = [
  {
    id: 'iniciante',
    label: 'Iniciante',
    description: 'Uma oitava, ritmo simples',
    speed: 55,
    spawnInterval: 3.2,
    letters: [...ALL_LETTERS],
    octaves: [4],
    durations: ['seminima'],
    accidentals: false,
  },
  {
    id: 'basico',
    label: 'Básico',
    description: 'Mesma faixa, mais rápido',
    speed: 85,
    spawnInterval: 2.4,
    letters: [...ALL_LETTERS],
    octaves: [4],
    durations: ['seminima', 'minima'],
    accidentals: false,
  },
  {
    id: 'intermediario',
    label: 'Intermediário',
    description: 'Duas oitavas, mais figuras rítmicas',
    speed: 105,
    spawnInterval: 2.0,
    letters: [...ALL_LETTERS],
    octaves: [4, 5],
    durations: ['seminima', 'minima', 'colcheia'],
    accidentals: false,
  },
  {
    id: 'avancado',
    label: 'Avançado',
    description: 'Faixa ampla, todos os ritmos e acidentes',
    speed: 130,
    spawnInterval: 1.7,
    letters: [...ALL_LETTERS],
    octaves: [3, 4, 5, 6],
    durations: ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia'],
    accidentals: true,
  },
  {
    id: 'personalizado',
    label: 'Personalizado',
    description: 'Ajuste tudo do seu jeito',
    speed: 90,
    spawnInterval: 2.2,
    letters: [...ALL_LETTERS],
    octaves: [4, 5],
    durations: ['seminima'],
    accidentals: false,
  },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id);
}
