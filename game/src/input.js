// Mouse only: Sizzle Line is played with a single pointer, one click per action. A click is
// turned into a kitchen zone (a ticket slot, the chopping board, the stove or the service window)
// by hitTest, in the same 1280x720 scene render.js draws, so the two never drift apart.
import { hitTest, viewTransform } from './render.js';

export function createInput(canvas) {
  let pending = [];
  let confirm = false;

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const px = (event.clientX - rect.left) * ratio;
    const py = (event.clientY - rect.top) * ratio;
    const view = viewTransform(canvas.width, canvas.height);
    const x = (px - view.x) / view.scale;
    const y = (py - view.y) / view.scale;
    const hit = hitTest(x, y);
    if (hit !== null) pending.push(hit);
    confirm = true;
  });

  return {
    /** The zones clicked since the last call, oldest first. */
    takeClicks() {
      const taken = pending;
      pending = [];
      return taken;
    },
    /** Whether the canvas was clicked at all since the last call (a title or game-over click). */
    takeConfirm() {
      const was = confirm;
      confirm = false;
      return was;
    },
  };
}
