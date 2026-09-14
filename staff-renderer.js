// Desenha a pauta (clave de sol), notas em movimento e linha de julgamento num Canvas 2D.

export const CANVAS_W = 900;
export const CANVAS_H = 320;
export const STAFF_START_X = 110;
export const STAFF_END_X = CANVAS_W - 20;
export const JUDGE_X = 190;
export const BASE_Y = 210; // y da linha de baixo (Mi4, step 0)
export const STEP_PX = 9; // px por step diatônico (metade do espaçamento entre linhas)

function stepToY(step) {
  return BASE_Y - step * STEP_PX;
}

export function drawStaff(ctx) {
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 5 linhas da pauta (steps 0,2,4,6,8)
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
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

  // linha de julgamento
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
  if (note.judged === 'correct') return '#2e9e4f';
  if (note.judged === 'wrong' || note.judged === 'missed') return '#d64545';
  if (note.isCurrentTarget) return '#e07a3f';
  return '#222';
}

export function drawNote(ctx, note) {
  const y = stepToY(note.step);
  const color = colorForNote(note);

  drawLedgerLines(ctx, note.x, note.step, color);

  if (note.accidental !== 0) {
    ctx.fillStyle = color;
    ctx.font = 'bold 22px serif';
    ctx.fillText(note.accidental === 1 ? '♯' : '♭', note.x - 24, y + 7);
  }

  ctx.save();
  ctx.translate(note.x, y);
  ctx.rotate(-0.35);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.5, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // haste simples
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const stemUp = note.step < 4;
  ctx.moveTo(note.x + (stemUp ? 8 : -8), y);
  ctx.lineTo(note.x + (stemUp ? 8 : -8), y + (stemUp ? -34 : 34));
  ctx.stroke();
}

export function render(ctx, notes) {
  drawStaff(ctx);
  for (const note of notes) {
    drawNote(ctx, note);
  }
}
