// A tiny seeded generator (splitmix32) so a given seed always deals the same run of tickets: the
// screenshot scenes in shots.js replay the exact same service every time they are staged.

export function createDeal(seed) {
  let state = seed >>> 0;
  return function deal() {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    z = (z ^ (z >>> 15)) >>> 0;
    return z / 4294967296;
  };
}

/** One element of `list`, chosen by `deal()` (a 0..1 generator). */
export function pick(deal, list) {
  return list[Math.floor(deal() * list.length) % list.length];
}

/** A whole number from `min` to `max`, inclusive, by `deal()`. */
export function range(deal, min, max) {
  return min + deal() * (max - min);
}
