// The kitchen's rules and state, with no drawing and no browser in it: the order board, the two
// stations (chopping board and stove), scoring and combo. Nothing here allocates every frame but
// the odd ticket object, so a long service never gets heavy. useStation and serve are the two
// actions a click resolves; step(dt) only advances clocks and deals new tickets.
import { COLD_SECONDS, DISHES, ORDER_SLOTS, SCORE, SPAWN_INTERVAL, STATION_BUSY, TICKET_SECONDS_PER_STEP, TICKET_SLACK } from './config.js';
import { pick, range } from './random.js';

export const EVENT_STEP = 1;
export const EVENT_SERVE = 2;
export const EVENT_MISS = 4;
export const EVENT_OVER = 8;
export const EVENT_BUZZ = 16;
export const EVENT_COLD = 32;
export const EVENT_COMBO = 64;

/** Every multiple of a combo that earns its own little celebration. */
const COMBO_CELEBRATE_STEP = 5;

const BASE_DISH_IDS = Object.keys(DISHES).filter((id) => DISHES[id].unlockSeconds === undefined);
const GRAND_DISH_IDS = Object.keys(DISHES).filter((id) => DISHES[id].unlockSeconds !== undefined);

function spawnInterval(elapsed) {
  const t = Math.min(1, elapsed / SPAWN_INTERVAL.rampSeconds);
  const [startMin, startMax] = SPAWN_INTERVAL.start;
  const [endMin, endMax] = SPAWN_INTERVAL.end;
  return { min: startMin + (endMin - startMin) * t, max: startMax + (endMax - startMax) * t };
}

export function createWorld(deal, roundSeconds) {
  const state = {
    elapsed: 0,
    timeLeft: roundSeconds,
    orders: [],
    activeOrderId: null,
    stationBusy: { chop: 0, stove: 0 },
    impact: { chop: 0, stove: 0 },
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    spawnTimer: 0,
    nextId: 1,
    lastGain: 0,
    lastCold: false,
    flashServe: 0,
    flashMiss: 0,
    flashBuzz: 0,
    flashStep: 0,
    comboCelebrate: 0,
  };

  function dishPool() {
    return state.elapsed >= DISHES.grand_platter.unlockSeconds ? [...BASE_DISH_IDS, ...GRAND_DISH_IDS] : BASE_DISH_IDS;
  }

  function reset() {
    state.elapsed = 0;
    state.timeLeft = roundSeconds;
    state.orders.length = 0;
    state.activeOrderId = null;
    state.stationBusy.chop = 0;
    state.stationBusy.stove = 0;
    state.impact.chop = 0;
    state.impact.stove = 0;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.missed = 0;
    state.nextId = 1;
    state.lastGain = 0;
    state.lastCold = false;
    state.flashServe = 0;
    state.flashMiss = 0;
    state.flashBuzz = 0;
    state.flashStep = 0;
    state.comboCelebrate = 0;
    const { min, max } = spawnInterval(0);
    state.spawnTimer = range(deal, min, max);
  }

  function spawnOrder() {
    if (state.orders.length >= ORDER_SLOTS) return;
    const dishId = pick(deal, dishPool());
    const dish = DISHES[dishId];
    const total = dish.steps.length * TICKET_SECONDS_PER_STEP + TICKET_SLACK;
    state.orders.push({ id: state.nextId++, dishId, stepsDone: 0, remaining: total, total, held: 0, cold: false });
  }

  function activeOrder() {
    return state.orders.find((o) => o.id === state.activeOrderId) ?? null;
  }

  function selectOrder(id) {
    if (state.orders.some((o) => o.id === id)) state.activeOrderId = id;
  }

  function useStation(stationName) {
    if (state.stationBusy[stationName] > 0) return 0;
    const order = activeOrder();
    if (order === null) return 0;
    const dish = DISHES[order.dishId];
    if (order.stepsDone >= dish.steps.length) return 0;
    const step = dish.steps[order.stepsDone];
    if (step.station !== stationName) {
      state.flashBuzz = 0.3;
      return EVENT_BUZZ;
    }
    order.stepsDone += 1;
    state.stationBusy[stationName] = STATION_BUSY;
    state.impact[stationName] = 0.25;
    state.flashStep = 0.2;
    return EVENT_STEP;
  }

  function serve() {
    const order = activeOrder();
    if (order === null) return 0;
    const dish = DISHES[order.dishId];
    if (order.stepsDone < dish.steps.length) return 0;
    let events = EVENT_SERVE;
    if (order.cold) {
      state.lastGain = SCORE.coldFlat;
      state.lastCold = true;
      state.combo = 0;
    } else {
      const ratio = Math.max(0, Math.min(1, order.remaining / order.total));
      const bonus = Math.round(SCORE.speedBonusMax * ratio);
      const comboMult = 1 + Math.min(state.combo, SCORE.comboCap) * 0.1;
      state.lastGain = Math.round((SCORE.base * dish.reward + bonus) * comboMult);
      state.lastCold = false;
      state.combo += 1;
      if (state.combo > 0 && state.combo % COMBO_CELEBRATE_STEP === 0) {
        state.comboCelebrate = 1.1;
        events |= EVENT_COMBO;
      }
    }
    state.score += state.lastGain;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    state.flashServe = 0.4;
    state.orders = state.orders.filter((o) => o.id !== order.id);
    state.activeOrderId = null;
    return events;
  }

  function step(dt, harmless) {
    let events = 0;
    if (state.stationBusy.chop > 0) state.stationBusy.chop = Math.max(0, state.stationBusy.chop - dt);
    if (state.stationBusy.stove > 0) state.stationBusy.stove = Math.max(0, state.stationBusy.stove - dt);
    if (state.impact.chop > 0) state.impact.chop = Math.max(0, state.impact.chop - dt);
    if (state.impact.stove > 0) state.impact.stove = Math.max(0, state.impact.stove - dt);
    if (state.flashServe > 0) state.flashServe = Math.max(0, state.flashServe - dt);
    if (state.flashMiss > 0) state.flashMiss = Math.max(0, state.flashMiss - dt);
    if (state.flashBuzz > 0) state.flashBuzz = Math.max(0, state.flashBuzz - dt);
    if (state.flashStep > 0) state.flashStep = Math.max(0, state.flashStep - dt);
    if (state.comboCelebrate > 0) state.comboCelebrate = Math.max(0, state.comboCelebrate - dt);

    if (harmless) return events;

    state.elapsed += dt;
    state.timeLeft = Math.max(0, roundSeconds - state.elapsed);

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < ORDER_SLOTS) {
      spawnOrder();
      const { min, max } = spawnInterval(state.elapsed);
      state.spawnTimer += range(deal, min, max);
    }

    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.remaining -= dt;
      const dish = DISHES[order.dishId];
      if (order.stepsDone >= dish.steps.length) {
        order.held += dt;
        if (!order.cold && order.held > COLD_SECONDS) {
          order.cold = true;
          events |= EVENT_COLD;
        }
      }
      if (order.remaining <= 0) {
        if (order.id === state.activeOrderId) state.activeOrderId = null;
        state.orders.splice(i, 1);
        state.missed += 1;
        state.combo = 0;
        state.flashMiss = 0.4;
        events |= EVENT_MISS;
      }
    }

    if (state.timeLeft <= 0) events |= EVENT_OVER;
    return events;
  }

  reset();
  return { state, reset, step, selectOrder, useStation, serve, activeOrder };
}
