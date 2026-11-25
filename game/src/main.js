// Boot and the one loop: the pointer is read every frame, the kitchen advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is there.
// Sizzle Line has three screens: title, play (one service) and the results screen after it.
//
// ?seed=N fixes which tickets come in. ?shot=start|rush|ready|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { ROUND_SECONDS } from './config.js';
import { createDeal } from './random.js';
import { createWorld, EVENT_MISS, EVENT_OVER } from './world.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createDeal(seed), ROUND_SECONDS);
const renderer = createRenderer(canvas);

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

const STEP_SECONDS = 1 / 60;

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startService() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Service started. Chop, cook, then pass the plate.');
  }

  function endService() {
    screen = SCREEN_OVER;
    announce(`Service's over. Served ${world.state.served}, missed ${world.state.missed}, score ${world.state.score}.`);
  }

  function handleClicks() {
    for (const hit of input.takeClicks()) {
      if (hit.zone === 'ticket') {
        const order = world.state.orders[hit.slot];
        if (order) world.selectOrder(order.id);
      } else if (hit.zone === 'chop') {
        world.useStation('chop');
      } else if (hit.zone === 'stove') {
        world.useStation('stove');
      } else if (hit.zone === 'pass') {
        const gained = world.serve();
        if (gained) announce(`Served for ${world.state.lastGain}. Combo x${world.state.combo}.`);
      }
    }
  }

  function step() {
    const events = world.step(STEP_SECONDS, false);
    if (events & EVENT_OVER) endService();
    else if (events & EVENT_MISS) announce('A ticket burned. Combo lost.');
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (input.takeConfirm() && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startService();
    }
    if (screen === SCREEN_PLAY) {
      handleClicks();
      accumulator += dt;
      while (accumulator >= STEP_SECONDS && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP_SECONDS;
      }
    } else {
      input.takeClicks();
      world.step(dt, true);
      accumulator = 0;
    }
    renderer.draw(world.state, screen, dt);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) last = performance.now();
  });

  announce('Sizzle Line. Click to start service.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
