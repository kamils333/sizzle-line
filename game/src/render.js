// Drawing only: the world's state and the current screen in, pixels out. The 1280x720 kitchen is
// scaled to fit the window and centred. Flat shapes and a little glow, canvas text for the board
// and the HUD, nothing photographic: Sizzle Line draws its own kitchen, its own food and its own
// sign, never another game's.
import { DISHES, FIELD, FONT, INGREDIENTS, ORDER_SLOTS, PALETTE, ROUND_SECONDS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const LAYOUT = {
  timer: { x: 92, y: 78, r: 50 },
  board: { x: 280, y: 24, w: 220, h: 148, gap: 30 },
  chop: { x: 90, y: 230, w: 320, h: 270 },
  stove: { x: 480, y: 230, w: 320, h: 270 },
  pass: { x: 870, y: 230, w: 320, h: 270 },
  counter: { x: 0, y: 560, w: FIELD.width, h: 160 },
};

const COUNTER_ITEMS = Object.keys(INGREDIENTS);

export function hitTest(x, y) {
  for (let i = 0; i < ORDER_SLOTS; i += 1) {
    const bx = LAYOUT.board.x + i * (LAYOUT.board.w + LAYOUT.board.gap);
    if (x >= bx && x <= bx + LAYOUT.board.w && y >= LAYOUT.board.y && y <= LAYOUT.board.y + LAYOUT.board.h) {
      return { zone: 'ticket', slot: i };
    }
  }
  if (inRect(x, y, LAYOUT.chop)) return { zone: 'chop' };
  if (inRect(x, y, LAYOUT.stove)) return { zone: 'stove' };
  if (inRect(x, y, LAYOUT.pass)) return { zone: 'pass' };
  return null;
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** How the fixed 1280x720 scene maps onto a canvas of `width` by `height` device pixels. */
export function viewTransform(width, height) {
  const scale = Math.min(width / FIELD.width, height / FIELD.height);
  return { scale, x: (width - FIELD.width * scale) / 2, y: (height - FIELD.height * scale) / 2 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(ctx, value, x, y, size, color, align, weight) {
  ctx.font = `${weight ?? 400} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

/** One ingredient's icon, centred at (cx, cy), roughly `s` pixels across. Flat shapes, no photos. */
function drawIngredient(ctx, key, cx, cy, s) {
  const tone = INGREDIENTS[key].tone;
  ctx.save();
  ctx.translate(cx, cy);
  switch (key) {
    case 'bun':
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.42, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#c9823f';
      roundRect(ctx, -s * 0.42, s * 0.05, s * 0.84, s * 0.22, s * 0.08);
      ctx.fill();
      break;
    case 'tomato':
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a7a33';
      ctx.beginPath();
      ctx.moveTo(-s * 0.12, -s * 0.38);
      ctx.lineTo(0, -s * 0.52);
      ctx.lineTo(s * 0.12, -s * 0.38);
      ctx.fill();
      break;
    case 'greens':
      ctx.fillStyle = tone;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.ellipse(i * s * 0.22, -Math.abs(i) * s * 0.06, s * 0.22, s * 0.32, i * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'herring':
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.42, s * 0.2, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.36, 0);
      ctx.lineTo(s * 0.54, -s * 0.16);
      ctx.lineTo(s * 0.54, s * 0.16);
      ctx.closePath();
      ctx.fill();
      break;
    case 'patty':
      ctx.fillStyle = tone;
      roundRect(ctx, -s * 0.4, -s * 0.2, s * 0.8, s * 0.4, s * 0.16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = Math.max(1, s * 0.03);
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.26, i * s * 0.1);
        ctx.lineTo(s * 0.26, i * s * 0.1);
        ctx.stroke();
      }
      break;
    case 'broth':
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.4, 0, Math.PI, false);
      ctx.fill();
      ctx.strokeStyle = tone;
      ctx.lineWidth = Math.max(1, s * 0.06);
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s * 0.05);
      ctx.lineTo(s * 0.4, s * 0.05);
      ctx.stroke();
      break;
    case 'noodles': {
      ctx.strokeStyle = tone;
      ctx.lineWidth = Math.max(2, s * 0.08);
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.36, i * s * 0.16);
        ctx.quadraticCurveTo(0, i * s * 0.16 - s * 0.18, s * 0.36, i * s * 0.16);
        ctx.stroke();
      }
      break;
    }
    case 'rice':
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.arc(0, s * 0.08, s * 0.38, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = Math.max(1, s * 0.03);
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, -s * 0.3);
      ctx.quadraticCurveTo(-s * 0.02, -s * 0.44, s * 0.04, -s * 0.34);
      ctx.stroke();
      break;
    default:
      break;
  }
  ctx.restore();
}

function drawBackdrop(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  grad.addColorStop(0, PALETTE.backdrop);
  grad.addColorStop(1, PALETTE.floor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, 560);
}

function drawTimer(ctx, timeLeft) {
  const { x, y, r } = LAYOUT.timer;
  const ratio = Math.max(0, Math.min(1, timeLeft / ROUND_SECONDS));
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, r + 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = ratio < 0.2 ? PALETTE.bad : ratio < 0.45 ? PALETTE.warn : PALETTE.good;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
  ctx.stroke();
  label(ctx, String(Math.ceil(timeLeft)), x, y + 10, 32, PALETTE.text, 'center', 700);
  ctx.restore();
}

function drawHud(ctx, state) {
  label(ctx, `${state.score}`, FIELD.width - 40, 48, 36, PALETTE.text, 'right', 700);
  label(ctx, 'SERVICE SCORE', FIELD.width - 40, 68, 15, PALETTE.textDim, 'right', 600);
  if (state.combo > 0) {
    label(ctx, `COMBO x${state.combo}`, FIELD.width - 40, 104, 22, PALETTE.comboText, 'right', 700);
  }
}

function ticketProgressColor(ratio) {
  if (ratio < 0.25) return PALETTE.bad;
  if (ratio < 0.55) return PALETTE.warn;
  return PALETTE.good;
}

function drawTicket(ctx, order, index, activeId) {
  const b = LAYOUT.board;
  const x = b.x + index * (b.w + b.gap);
  const y = b.y;
  const dish = DISHES[order.dishId];
  const active = order.id === activeId;
  ctx.save();
  ctx.shadowColor = active ? 'rgba(255,209,102,0.8)' : 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = active ? 24 : 10;
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, x, y, b.w, b.h, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (active) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = PALETTE.comboText;
    roundRect(ctx, x + 2, y + 2, b.w - 4, b.h - 4, 12);
    ctx.stroke();
  }
  label(ctx, dish.name, x + b.w / 2, y + 30, 18, '#3a2a1f', 'center', 700);
  const iconY = y + 66;
  const steps = dish.steps;
  const spacing = Math.min(56, (b.w - 40) / steps.length);
  const startX = x + b.w / 2 - (spacing * (steps.length - 1)) / 2;
  for (let i = 0; i < steps.length; i += 1) {
    const done = i < order.stepsDone;
    ctx.save();
    ctx.globalAlpha = done ? 1 : 0.28;
    drawIngredient(ctx, steps[i].ingredient, startX + i * spacing, iconY, 40);
    ctx.restore();
    if (done) {
      ctx.strokeStyle = PALETTE.good;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startX + i * spacing, iconY, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const ratio = Math.max(0, order.remaining / order.total);
  const barY = y + b.h - 16;
  ctx.fillStyle = PALETTE.ticketShade;
  roundRect(ctx, x + 14, barY, b.w - 28, 8, 4);
  ctx.fill();
  ctx.fillStyle = ticketProgressColor(ratio);
  roundRect(ctx, x + 14, barY, (b.w - 28) * ratio, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawBoard(ctx, state) {
  for (let i = 0; i < state.orders.length; i += 1) drawTicket(ctx, state.orders[i], i, state.activeOrderId);
  const empties = ORDER_SLOTS - state.orders.length;
  for (let i = 0; i < empties; i += 1) {
    const slot = state.orders.length + i;
    const x = LAYOUT.board.x + slot * (LAYOUT.board.w + LAYOUT.board.gap);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    roundRect(ctx, x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 14);
    ctx.stroke();
    ctx.restore();
  }
}

function drawChop(ctx, state) {
  const r = LAYOUT.chop;
  ctx.fillStyle = PALETTE.chop;
  roundRect(ctx, r.x, r.y + 40, r.w, r.h - 40, 18);
  ctx.fill();
  ctx.fillStyle = PALETTE.chopTop;
  roundRect(ctx, r.x + 16, r.y + 56, r.w - 32, r.h - 96, 12);
  ctx.fill();
  // A few worn knife-marks on the board, so it reads as used even before the knife falls on it.
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (const [mx, my, ang] of [[-70, 30, 0.5], [50, 50, -0.3], [-20, -40, 0.2], [80, -20, -0.6]]) {
    ctx.beginPath();
    ctx.moveTo(r.x + r.w / 2 + mx - 14 * Math.cos(ang), r.y + r.h / 2 + 10 + my - 14 * Math.sin(ang));
    ctx.lineTo(r.x + r.w / 2 + mx + 14 * Math.cos(ang), r.y + r.h / 2 + 10 + my + 14 * Math.sin(ang));
    ctx.stroke();
  }
  ctx.restore();

  const busy = state.stationBusy.chop > 0;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2 + 10;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(busy ? -0.46 : -0.2);
  // The blade: a wide wedge, bright along its edge, with a faint centre ridge.
  ctx.fillStyle = '#d7dbe0';
  ctx.beginPath();
  ctx.moveTo(-58, 22);
  ctx.lineTo(64, -6);
  ctx.lineTo(82, -2);
  ctx.lineTo(-58, 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#eef2f5';
  ctx.beginPath();
  ctx.moveTo(60, -5);
  ctx.lineTo(82, -2);
  ctx.lineTo(60, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-50, 24);
  ctx.lineTo(60, 0);
  ctx.stroke();
  // The handle: a dark rounded grip bolted to the blade's back edge.
  ctx.fillStyle = '#2a2420';
  roundRect(ctx, -92, 16, 40, 22, 10);
  ctx.fill();
  ctx.fillStyle = '#4a4038';
  ctx.beginPath();
  ctx.arc(-78, 27, 3, 0, Math.PI * 2);
  ctx.arc(-58, 25, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (state.flashBuzz > 0) drawBuzz(ctx, cx, cy - 70);
  label(ctx, 'CHOPPING BOARD', r.x + r.w / 2, r.y + 26, 16, PALETTE.textDim, 'center', 700);
}

/** A single teardrop flame, its tip `grow` pixels taller while the burner is lit. */
function drawFlame(ctx, cx, cy, grow) {
  const h = 30 + grow;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = PALETTE.flame;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.bezierCurveTo(-16, 4, -14, -h * 0.5, -3, -h);
  ctx.bezierCurveTo(2, -h * 0.6, -4, -h * 0.4, 2, -h * 0.3);
  ctx.bezierCurveTo(10, -h * 0.5, 16, -4, 0, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.flameCore;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.bezierCurveTo(-7, 4, -6, -h * 0.28, 0, -h * 0.5);
  ctx.bezierCurveTo(6, -h * 0.28, 7, 4, 0, 10);
  ctx.fill();
  ctx.restore();
}

function drawStove(ctx, state, pulse) {
  const r = LAYOUT.stove;
  ctx.fillStyle = PALETTE.stove;
  roundRect(ctx, r.x, r.y + 40, r.w, r.h - 40, 18);
  ctx.fill();
  ctx.fillStyle = PALETTE.stoveTop;
  roundRect(ctx, r.x + 16, r.y + 56, r.w - 32, 44, 10);
  ctx.fill();
  const cx = r.x + r.w / 2;
  const burnerY = r.y + 100;
  const panY = r.y + 150;
  const busy = state.stationBusy.stove > 0;
  const lit = busy ? 14 + pulse * 10 : 2 + pulse * 2;

  // Two burner rings beneath the pan, always a little lit, blazing once the stove is busy.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.globalAlpha = busy ? 1 : 0.6;
    ctx.strokeStyle = PALETTE.flame;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx + side * 60, burnerY + 24, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawFlame(ctx, cx + side * 60, burnerY, lit);
  }

  // The pan: a dark ellipse, a lighter rim, a handle, and its contents tinting with the heat.
  ctx.fillStyle = '#17181d';
  ctx.beginPath();
  ctx.ellipse(cx, panY, 96, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2d33';
  ctx.beginPath();
  ctx.ellipse(cx, panY - 6, 96, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = busy ? '#e8a24a' : '#b9823f';
  ctx.beginPath();
  ctx.ellipse(cx, panY - 6, 78, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b5f68';
  roundRect(ctx, cx + 92, panY - 14, 46, 16, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, panY - 6, 96, 30, 0, Math.PI * 0.08, Math.PI * 0.92);
  ctx.stroke();

  if (busy) {
    for (const side of [-1, 0, 1]) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const sx = cx + side * 30;
      const lift = pulse * 10;
      ctx.moveTo(sx, panY - 26 - lift);
      ctx.quadraticCurveTo(sx - 10, panY - 56 - lift, sx, panY - 82 - lift);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (state.flashBuzz > 0) drawBuzz(ctx, cx, r.y - 4);
  label(ctx, 'STOVE', r.x + r.w / 2, r.y + 26, 16, PALETTE.textDim, 'center', 700);
}

function drawBuzz(ctx, x, y) {
  label(ctx, '✕', x, y, 30, PALETTE.bad, 'center', 900);
}

function drawPass(ctx, state, pulse) {
  const r = LAYOUT.pass;
  ctx.fillStyle = PALETTE.window;
  roundRect(ctx, r.x, r.y, r.w, r.h, 18);
  ctx.fill();
  const order = state.orders.find((o) => o.id === state.activeOrderId) ?? null;
  const dish = order ? DISHES[order.dishId] : null;
  const ready = order !== null && order.stepsDone >= dish.steps.length;
  const cx = r.x + r.w / 2;
  const cy = r.y + 150;
  ctx.save();
  if (ready) {
    ctx.shadowColor = PALETTE.windowGlow;
    ctx.shadowBlur = 24 + pulse * 10;
  }
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.arc(cx, cy, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = PALETTE.plateRim;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  if (dish !== null) {
    const spacing = 58;
    const startX = cx - (spacing * (dish.steps.length - 1)) / 2;
    for (let i = 0; i < dish.steps.length; i += 1) {
      if (i < order.stepsDone) drawIngredient(ctx, dish.steps[i].ingredient, startX + i * spacing, cy, 46);
    }
  }
  if (ready) {
    label(ctx, 'READY — CLICK TO SERVE', cx, r.y + r.h - 20, 17, PALETTE.windowGlow, 'center', 700);
  } else if (order !== null) {
    label(ctx, `${order.stepsDone}/${dish.steps.length} PLATED`, cx, r.y + r.h - 20, 15, PALETTE.textDim, 'center', 600);
  } else {
    label(ctx, 'PICK A TICKET', cx, r.y + r.h - 20, 15, PALETTE.textDim, 'center', 600);
  }
  label(ctx, 'SERVICE WINDOW', r.x + r.w / 2, r.y + 26, 16, PALETTE.textDim, 'center', 700);
  if (state.flashServe > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.flashServe * 2.4);
    label(ctx, `+${state.lastGain}`, cx, cy - 70, 30, PALETTE.good, 'center', 800);
    ctx.restore();
  }
}

function drawCounter(ctx, t) {
  const c = LAYOUT.counter;
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(c.x, c.y, c.w, 18);
  const n = COUNTER_ITEMS.length;
  const slot = c.w / n;
  for (let i = 0; i < n; i += 1) {
    const key = COUNTER_ITEMS[i];
    const cx = c.x + slot * (i + 0.5);
    const cy = c.y + 70 + Math.sin(t * 1.4 + i) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, cx - 44, c.y + 34, 88, 92, 12);
    ctx.fill();
    drawIngredient(ctx, key, cx, cy, 52);
    label(ctx, INGREDIENTS[key].label, cx, c.y + 142, 14, PALETTE.textDim, 'center', 600);
  }
}

function drawPanel(ctx, title, lines, prompt) {
  const w = 620;
  const h = 150 + lines.length * 34 + 90;
  const x = (FIELD.width - w) / 2;
  const y = (FIELD.height - h) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,6,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, x, y, w, h, 22);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = PALETTE.flame;
  ctx.lineWidth = 4;
  roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 20);
  ctx.stroke();
  label(ctx, title, FIELD.width / 2, y + 86, 46, PALETTE.ticket, 'center', 800);
  for (let i = 0; i < lines.length; i += 1) {
    label(ctx, lines[i], FIELD.width / 2, y + 150 + i * 34, 22, PALETTE.textDim, 'center', 500);
  }
  label(ctx, prompt, FIELD.width / 2, y + h - 36, 22, PALETTE.comboText, 'center', 700);
  ctx.restore();
}

function grade(score) {
  if (score >= 2200) return 'S';
  if (score >= 1500) return 'A';
  if (score >= 900) return 'B';
  if (score >= 400) return 'C';
  return 'D';
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let view = viewTransform(canvas.width, canvas.height);
  let clock = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view = viewTransform(canvas.width, canvas.height);
  }

  function draw(state, screen, dt) {
    clock += dt;
    const pulse = (Math.sin(clock * 6) + 1) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    drawBackdrop(ctx);
    drawCounter(ctx, clock);
    drawChop(ctx, state);
    drawStove(ctx, state, pulse);
    drawPass(ctx, state, pulse);
    drawBoard(ctx, state);
    drawTimer(ctx, state.timeLeft);
    drawHud(ctx, state);

    if (screen === SCREEN_TITLE) {
      drawPanel(ctx, 'SIZZLE LINE', ['A one-cook kitchen rush.', 'Chop at the board, cook at the stove,', 'then pass the plate before the ticket burns.'], 'Click to start service');
    } else if (screen === SCREEN_OVER) {
      drawPanel(
        ctx,
        'SERVICE’S OVER',
        [`Dishes served: ${state.served}    Missed: ${state.missed}`, `Best combo: x${state.bestCombo}`, `Score ${state.score} — Grade ${grade(state.score)}`],
        'Click to cook again',
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
