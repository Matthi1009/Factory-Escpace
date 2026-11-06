// Ausbreitung und Abbau der Verschmutzung auf game.env.field('pollution').
// factory erzeugt Verschmutzung an ihren Gebäuden, hier wird sie verteilt und klingt langsam ab.
import { TERRAIN_INDEX, type Game } from '../../core';
import { ENV_CONFIG } from './config';

const C = ENV_CONFIG.simulation;

export class PollutionSimulation {
  private buffer: Float32Array;
  /** Wird nach jedem Schritt aufgerufen (z. B. Overlay neu einfärben) */
  onStep: (() => void) | null = null;

  constructor(private game: Game) {
    this.buffer = new Float32Array(game.env.field('pollution').length);
    game.onTick((g) => {
      if (g.tickCount % C.stepTicks === 0) this.step();
    });
  }

  /** Ein Diffusionsschritt: jede Kachel gibt einen Anteil an ihre Nachbarn ab, danach Abbau. */
  step(): void {
    const { world } = this.game;
    const p = this.game.env.field('pollution');
    const out = this.buffer;
    const w = world.width;
    const h = world.height;
    const D = C.diffusion;
    const forest = TERRAIN_INDEX.forest;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const i = row + x;
        const v = p[i]!;
        // Ränder reflektieren: fehlende Nachbarn zählen wie die Kachel selbst
        const l = x > 0 ? p[i - 1]! : v;
        const r = x < w - 1 ? p[i + 1]! : v;
        const u = y > 0 ? p[i - w]! : v;
        const d = y < h - 1 ? p[i + w]! : v;
        let n = v + D * (l + r + u + d - 4 * v);
        n *= 1 - C.decay - (world.terrain[i] === forest ? C.forestAbsorb : 0);
        out[i] = n < C.epsilon ? 0 : n;
      }
    }
    p.set(out);
    this.onStep?.();
  }
}
