// Every tuning number, colour and recipe in one place. The kitchen is a fixed 1280x720 logical
// scene; render.js scales it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** How long one service (a full round) runs. */
export const ROUND_SECONDS = 90;

/** How many ticket slots the order board holds at once. */
export const ORDER_SLOTS = 3;

/** Seconds between new tickets, picked at random in this range (tighter as the rush builds). */
export const SPAWN_INTERVAL = { start: [2.2, 3.4], end: [1.1, 2], rampSeconds: 50 };

/** How long a station stays busy after one click, so a dish is built click by click, not by holding one down. */
export const STATION_BUSY = 0.6;

/** Points and combo. */
export const SCORE = {
  base: 90,
  speedBonusMax: 160,
  comboStep: 18,
  comboCap: 10,
  missPenaltyCombo: true,
};

/** An ingredient the pantry keeps on the counter: its label and the station that works it. */
export const INGREDIENTS = {
  bun: { label: 'Bun', station: 'chop', tone: '#d9a066' },
  tomato: { label: 'Tomato', station: 'chop', tone: '#e2543b' },
  greens: { label: 'Greens', station: 'chop', tone: '#6fb04a' },
  herring: { label: 'Herring', station: 'chop', tone: '#8fa6c9' },
  patty: { label: 'Patty', station: 'stove', tone: '#7a4a32' },
  broth: { label: 'Broth', station: 'stove', tone: '#c98a3a' },
  noodles: { label: 'Noodles', station: 'stove', tone: '#f0d98c' },
  rice: { label: 'Rice', station: 'stove', tone: '#f4f1e6' },
};

/** The dishes a ticket can ask for, each a short build order across the two stations. */
export const DISHES = {
  hearth_stack: {
    name: 'Hearth Stack',
    steps: [
      { ingredient: 'greens', station: 'chop' },
      { ingredient: 'patty', station: 'stove' },
    ],
    reward: 1,
  },
  garden_bowl: {
    name: 'Garden Bowl',
    steps: [
      { ingredient: 'tomato', station: 'chop' },
      { ingredient: 'greens', station: 'chop' },
    ],
    reward: 1,
  },
  steam_noodle: {
    name: 'Steam Noodle',
    steps: [
      { ingredient: 'noodles', station: 'stove' },
      { ingredient: 'broth', station: 'stove' },
    ],
    reward: 1,
  },
  harbor_roll: {
    name: 'Harbor Roll',
    steps: [
      { ingredient: 'herring', station: 'chop' },
      { ingredient: 'rice', station: 'stove' },
    ],
    reward: 1,
  },
  grand_platter: {
    name: 'Grand Platter',
    steps: [
      { ingredient: 'tomato', station: 'chop' },
      { ingredient: 'herring', station: 'chop' },
      { ingredient: 'rice', station: 'stove' },
    ],
    reward: 1.6,
    unlockSeconds: 18,
  },
};

/** How many seconds a ticket allows, roughly 6.5s a step plus a little slack. */
export const TICKET_SECONDS_PER_STEP = 7;
export const TICKET_SLACK = 4;

export const PALETTE = {
  backdrop: '#201611',
  floor: '#2c2019',
  counter: '#3a2a1f',
  counterTop: '#4a3626',
  board: '#5b2e22',
  boardShadow: '#431f17',
  ticket: '#fbf3df',
  ticketShade: '#e7dcc0',
  chop: '#6b4a2f',
  chopTop: '#8a6239',
  stove: '#2e2a2a',
  stoveTop: '#3d3838',
  flame: '#ff8a3d',
  flameCore: '#ffd166',
  plate: '#f6f4ee',
  plateRim: '#d8d2c2',
  window: '#1c3b35',
  windowGlow: '#43e0b4',
  text: '#fbf3df',
  textDim: '#c9bba0',
  good: '#6fd17a',
  warn: '#f2c14e',
  bad: '#e2543b',
  comboText: '#ffd166',
};

export const FONT = '"Liberation Sans", Arial, Helvetica, sans-serif';

export const BEST_KEY = 'sizzle-line.best';
