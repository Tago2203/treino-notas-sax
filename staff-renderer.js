// Desenha a pauta (clave de sol), notas em movimento e linha de julgamento num Canvas 2D.

// CANVAS_W/CANVAS_H definem o sistema de coordenadas do desenho. Foram
// encolhidos (eram 900x320) mantendo os outros números (STEP_PX, raio das
// notas, fonte da clave etc.) do mesmo tamanho de antes — como esses
// elementos passam a ocupar uma fração maior desse canvas menor, a pauta
// aparenta ser maior na tela. O aspect-ratio no CSS (#staff) precisa ser
// CANVAS_W/CANVAS_H. Mudar CANVAS_W também muda a distância (em "pixels"
// lógicos) que uma nota percorre no modo "notas passando" — por isso as
// velocidades em levels.js foram reduzidas na mesma proporção, pra manter
// a mesma sensação de velocidade real na tela.
export const CANVAS_W = 700;
// CANVAS_H calculado pra caber com folga a nota mais grave (Dó3) até a mais
// aguda (Si6) possíveis no jogo (oitavas 3 a 6, todas as notas — a faixa do
// nível "Avançado"/"Personalizado" com tudo marcado), com margem de sobra
// pra cabeça da nota e acidentes. É por isso que não dá pra apertar mais
// sem cortar nota em algum nível/configuração.
export const CANVAS_H = 291;
export const STAFF_START_X = 110;
export const STAFF_END_X = CANVAS_W - 20;
export const JUDGE_X = 190;
export const BASE_Y = 186; // y da linha de baixo (Mi4, step 0)
export const STEP_PX = 9; // px por step diatônico (metade do espaçamento entre linhas)

// Resolução física do canvas = tamanho exibido em tela × densidade de
// pixels do aparelho × esse fator extra, calculado em app.js. Não afeta o
// tamanho visual (isso é o CANVAS_H acima); só garante nitidez.
export const ZOOM = 1.0;

function stepToY(step) {
  return BASE_Y - step * STEP_PX;
}

export function drawStaff(ctx, showJudgeLine = true) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // 5 linhas da pauta (steps 0,2,4,6,8)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.1;
  for (let s = 0; s <= 8; s += 2) {
    const y = stepToY(s);
    ctx.beginPath();
    ctx.moveTo(STAFF_START_X, y);
    ctx.lineTo(STAFF_END_X, y);
    ctx.stroke();
  }

  // clave de sol
  ctx.fillStyle = '#222';
  ctx.font = '74px serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('𝄞', 30, stepToY(2) + 26);

  if (showJudgeLine) {
    ctx.save();
    ctx.strokeStyle = '#e07a3f';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(JUDGE_X, stepToY(10));
    ctx.lineTo(JUDGE_X, stepToY(-4));
    ctx.stroke();
    ctx.restore();
  }
}

function drawLedgerLines(ctx, x, step, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const halfWidth = 15;
  if (step > 8) {
    for (let s = 10; s <= step; s += 2) {
      const y = stepToY(s);
      ctx.beginPath();
      ctx.moveTo(x - halfWidth, y);
      ctx.lineTo(x + halfWidth, y);
      ctx.stroke();
    }
  } else if (step < 0) {
    for (let s = -2; s >= step; s -= 2) {
      const y = stepToY(s);
      ctx.beginPath();
      ctx.moveTo(x - halfWidth, y);
      ctx.lineTo(x + halfWidth, y);
      ctx.stroke();
    }
  }
}

function colorForNote(note) {
  if (note.judged === 'correct') return '#00c853';
  if (note.judged === 'wrong' || note.judged === 'missed') return '#ff1744';
  if (note.isCurrentTarget) return '#2979ff';
  return '#000000';
}

const DURATION_SHAPE = {
  semibreve: { hollow: true, stem: false, flags: 0 },
  minima: { hollow: true, stem: true, flags: 0 },
  seminima: { hollow: false, stem: true, flags: 0 },
  colcheia: { hollow: false, stem: true, flags: 1 },
  semicolcheia: { hollow: false, stem: true, flags: 2 },
};

function drawFlags(ctx, x, stemEndY, stemUp, color, count) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const y0 = stemEndY + (stemUp ? i * 8 : -i * 8);
    ctx.beginPath();
    if (stemUp) {
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(x + 14, y0 + 6, x + 10, y0 + 20);
      ctx.quadraticCurveTo(x + 6, y0 + 12, x, y0 + 6);
    } else {
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(x + 14, y0 - 6, x + 10, y0 - 20);
      ctx.quadraticCurveTo(x + 6, y0 - 12, x, y0 - 6);
    }
    ctx.closePath();
    ctx.fill();
  }
}

export function drawNote(ctx, note) {
  const y = stepToY(note.step);
  const color = colorForNote(note);
  const shape = DURATION_SHAPE[note.duration] || DURATION_SHAPE.seminima;

  drawLedgerLines(ctx, note.x, note.step, color);

  if (note.accidental !== 0) {
    ctx.fillStyle = color;
    ctx.font = 'bold 22px serif';
    ctx.fillText(note.accidental === 1 ? '♯' : '♭', note.x - 24, y + 7);
  }

  ctx.save();
  ctx.translate(note.x, y);
  ctx.rotate(-0.35);
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.5, 6.2, 0, 0, Math.PI * 2);
  if (shape.hollow) {
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();

  if (shape.stem) {
    const stemUp = note.step < 4;
    const stemX = note.x + (stemUp ? 8 : -8);
    const stemEndY = y + (stemUp ? -34 : 34);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(stemX, y);
    ctx.lineTo(stemX, stemEndY);
    ctx.stroke();

    if (shape.flags > 0) {
      drawFlags(ctx, stemX, stemEndY, stemUp, color, shape.flags);
    }
  }

  if (note.judged === 'wrong' || note.judged === 'missed') {
    drawErrorMark(ctx, note.x, y, color);
  }
}

function drawErrorMark(ctx, x, y, color) {
  const s = 13;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x + s, y - s);
  ctx.lineTo(x - s, y + s);
  ctx.stroke();
  ctx.restore();
}

export function render(ctx, notes, showJudgeLine = true) {
  // Escala calculada a partir da resolução física real do canvas (definida
  // em app.js), então o desenho sempre preenche o buffer inteiro nitidamente,
  // sem depender de um fator fixo.
  const scale = ctx.canvas.width / CANVAS_W;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawStaff(ctx, showJudgeLine);
  for (const note of notes) {
    drawNote(ctx, note);
  }
  ctx.restore();
}

export function layoutXPositions(count) {
  const startX = STAFF_START_X + 90;
  const endX = STAFF_END_X - 40;
  if (count <= 1) return [(startX + endX) / 2];
  const step = (endX - startX) / (count - 1);
  return Array.from({ length: count }, (_, i) => startX + i * step);
}
