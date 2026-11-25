// The screenshot scenes behind ?shot=start|rush|ready|end. Each one runs the real rules forward
// from a fresh kitchen, steered by a simple autopilot (always finish a ready plate, else work the
// most urgent ticket), and stops at the first frame that shows what the scene is for: a dish
// caught mid-assembly, or a plate held ready to serve. The same seed always lands on the same
// frame, since the autopilot's choices depend on nothing but the kitchen's own state.
import { DISHES, ROUND_SECONDS, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_IDLE_SECONDS = 3;
const RUSH_CAP_SECONDS = 60;
const READY_CAP_SECONDS = 60;

/** The most urgent order on the board (the least time left), or null when it is empty. */
function urgentOrder(state) {
  let best = null;
  for (const order of state.orders) if (best === null || order.remaining < best.remaining) best = order;
  return best;
}

/**
 * One decision: finish a ready plate (unless `hold`, which leaves it ready and unserved for the
 * camera), else advance the active order's next step, else pick the most urgent ticket. Returns
 * whether the active order is ready and was held rather than served.
 */
function tick(world, hold) {
  const state = world.state;
  const active = world.activeOrder();
  if (active !== null) {
    const dish = DISHES[active.dishId];
    if (active.stepsDone >= dish.steps.length) {
      if (hold) return true;
      world.serve();
      return false;
    }
    const step = dish.steps[active.stepsDone];
    if (state.stationBusy[step.station] === 0) world.useStation(step.station);
    return false;
  }
  const next = urgentOrder(state);
  if (next !== null) world.selectOrder(next.id);
  return false;
}

/** Set `world` to the named scene (any other name is start) and return the screen to draw it with. */
export function stageShot(name, world) {
  world.reset();

  if (name !== 'rush' && name !== 'ready' && name !== 'end') {
    for (let i = 0; i < START_IDLE_SECONDS / STEP; i += 1) world.step(STEP, true);
    return { screen: SCREEN_TITLE };
  }

  if (name === 'end') {
    for (let i = 0; i < ROUND_SECONDS / STEP; i += 1) {
      tick(world, false);
      if (world.step(STEP, false) & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER };
  }

  if (name === 'ready') {
    for (let i = 0; i < READY_CAP_SECONDS / STEP; i += 1) {
      const held = tick(world, true);
      if (held) break;
      if (world.step(STEP, false) & EVENT_OVER) break;
    }
    return { screen: SCREEN_PLAY };
  }

  // 'rush': stop the first time the active order is genuinely mid-build.
  for (let i = 0; i < RUSH_CAP_SECONDS / STEP; i += 1) {
    tick(world, false);
    if (world.step(STEP, false) & EVENT_OVER) break;
    const active = world.activeOrder();
    const steps = active === null ? 0 : DISHES[active.dishId].steps.length;
    if (active !== null && active.stepsDone > 0 && active.stepsDone < steps && i > 5 / STEP) break;
  }
  return { screen: SCREEN_PLAY };
}
