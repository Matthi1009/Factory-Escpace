// Klima: Temperatur, Strahlung und Bodenfeuchte – einmal pro Sekunde.
// Moderate Verschmutzung heizt auf (Wärmeinsel + Erderwärmung), extremer Smog und Strahlung kühlen ab
// (Smog-Winter, nuklearer Winter). Hitze und Smog trocknen den Boden aus; ohne Störung erholt er sich langsam.
// Zusätzliche Wärmequellen (Kraftfeld) tragen sich pro Schritt in heatSources ein.
import { ENV_DEFAULTS, TERRAIN_INDEX, TICKS_PER_SECOND, type Game } from '../../core';
import { ENV_CONFIG } from './config';

const C = ENV_CONFIG.climate;

export const STAT_AVG_TEMP = 'environment:avg_temperature';
export const STAT_MAX_TEMP = 'environment:max_temperature';
export const STAT_RADIATION = 'environment:radiation';

export class Climate {
  /** Zusätzliche Zieltemperatur pro Kachel (°C), wird jede Sekunde neu befüllt (z. B. Kraftfeld) */
  readonly heatSources: Float32Array;
  /** Wird pro Schritt vor der Berechnung aufgerufen, damit Wärmequellen sich eintragen können */
  onBeforeStep: (() => void)[] = [];
  private tmp: Float32Array;
  private baseWater: Float32Array;

  constructor(private game: Game) {
    const n = game.world.width * game.world.height;
    this.heatSources = new Float32Array(n);
    this.tmp = new Float32Array(n);
    // Ausgangswert der Bodenfeuchte merken (Seen 1, Land 0,6)
    this.baseWater = game.env.field('water').slice();
    game.stats.define({ id: STAT_AVG_TEMP, label: 'Ø Temperatur', unit: '°C', group: 'environment' });
    game.stats.define({ id: STAT_MAX_TEMP, label: 'Höchste Temperatur', unit: '°C', group: 'environment' });
    game.stats.define({ id: STAT_RADIATION, label: 'Strahlung gesamt', group: 'environment' });
    game.onTick((g) => {
      if (g.tickCount % TICKS_PER_SECOND === C.tickOffset) this.step();
    });
  }

  step(): void {
    const { env, world } = this.game;
    const w = world.width;
    const h = world.height;
    const p = env.field('pollution');
    const t = env.field('temperature');
    const r = env.field('radiation');
    const wa = env.field('water');
    const heat = this.heatSources;
    heat.fill(0);
    for (const fn of this.onBeforeStep) fn();

    const totalP = env.total('pollution');
    const global = C.globalWarming * (1 - Math.exp(-totalP / C.globalWarmingScale));
    const waterIdx = TERRAIN_INDEX.water;

    // 1) Temperatur: Richtung Zielwert, Bodenfeuchte: Erholung/Austrocknung
    for (let i = 0; i < t.length; i++) {
      const pv = p[i]!;
      let target = ENV_DEFAULTS.temperature + global + heat[i]!;
      target += C.heatIsland * (1 - Math.exp(-pv / C.heatIslandScale));
      if (pv > C.smogWinterStart) target -= C.smogWinter * (1 - Math.exp(-(pv - C.smogWinterStart) / C.smogWinterScale));
      const rv = r[i]!;
      if (rv > 0) target -= C.nuclearWinter * (1 - Math.exp(-rv / C.nuclearWinterScale));
      const tv = t[i]! + (target - t[i]!) * C.temperatureRelax;
      t[i] = tv;

      if (world.terrain[i] === waterIdx) continue; // Seen bleiben nass
      let wv = wa[i]! + (this.baseWater[i]! - wa[i]!) * C.waterRecovery;
      if (tv > C.waterHeatStart) wv -= C.waterHeatDry * (tv - C.waterHeatStart);
      wv -= C.waterPollutionDry * Math.min(pv, 20);
      wa[i] = wv < 0 ? 0 : wv > 1 ? 1 : wv;
    }

    // 2) Ausbreitung von Temperatur und Strahlung (Strahlung zerfällt sehr langsam)
    this.diffuse(t, C.temperatureDiffusion, 0, w, h);
    this.diffuse(r, C.radiationDiffusion, C.radiationDecay, w, h);

    if (this.game.tickCount % (TICKS_PER_SECOND * 2) === C.tickOffset) {
      this.game.stats.set(STAT_AVG_TEMP, Math.round(env.average('temperature') * 10) / 10);
      this.game.stats.set(STAT_MAX_TEMP, Math.round(env.max('temperature') * 10) / 10);
      this.game.stats.set(STAT_RADIATION, Math.round(env.total('radiation')));
    }
  }

  /** Ein Diffusionsschritt auf arr (Ränder reflektieren) mit Zerfall decay. */
  private diffuse(arr: Float32Array, D: number, decay: number, w: number, h: number): void {
    const out = this.tmp;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const i = row + x;
        const v = arr[i]!;
        const l = x > 0 ? arr[i - 1]! : v;
        const rr = x < w - 1 ? arr[i + 1]! : v;
        const u = y > 0 ? arr[i - w]! : v;
        const d = y < h - 1 ? arr[i + w]! : v;
        let n = v + D * (l + rr + u + d - 4 * v);
        if (decay) n *= 1 - decay;
        out[i] = n;
      }
    }
    arr.set(out);
  }
}
