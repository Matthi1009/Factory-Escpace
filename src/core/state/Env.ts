// Umwelt-Zustand pro Kachel. Nur Datencontainer – Ausbreitung, Wirkung usw. macht environment.
// Wer schreibt: factory (Verschmutzung an Gebäuden), environment (Ausbreitung), Debugpanel.
// Einheiten: pollution ≥ 0 (frei), temperature in °C (Start 20), radiation ≥ 0, water 0..1 (Bodenfeuchte).
import type { World } from '../world/World';
import { TERRAIN_INDEX } from '../content/terrain';

export type EnvField = 'pollution' | 'temperature' | 'radiation' | 'water';
export const ENV_FIELDS: readonly EnvField[] = ['pollution', 'temperature', 'radiation', 'water'];

export const ENV_DEFAULTS: Record<EnvField, number> = {
  pollution: 0,
  temperature: 20,
  radiation: 0,
  water: 0.6,
};

export class EnvState {
  readonly pollution: Float32Array;
  readonly temperature: Float32Array;
  readonly radiation: Float32Array;
  readonly water: Float32Array;

  private cacheTick = -1;
  private totals: Record<EnvField, number> = { pollution: 0, temperature: 0, radiation: 0, water: 0 };
  private maxima: Record<EnvField, number> = { pollution: 0, temperature: 0, radiation: 0, water: 0 };
  /** Wird vom Core gesetzt, damit Summen nur einmal pro Tick berechnet werden. */
  _tick = 0;

  constructor(private world: World) {
    const n = world.width * world.height;
    this.pollution = new Float32Array(n);
    this.temperature = new Float32Array(n).fill(ENV_DEFAULTS.temperature);
    this.radiation = new Float32Array(n);
    this.water = new Float32Array(n).fill(ENV_DEFAULTS.water);
    // Wasserflächen sind nass
    for (let i = 0; i < n; i++) if (world.terrain[i] === TERRAIN_INDEX.water) this.water[i] = 1;
  }

  /** Das rohe Array eines Felds (Index = world.index(x, y)). Direktes Schreiben ist erlaubt. */
  field(f: EnvField): Float32Array {
    return this[f];
  }

  get(f: EnvField, x: number, y: number): number {
    if (!this.world.inBounds(x, y)) return ENV_DEFAULTS[f];
    return this[f][this.world.index(x, y)]!;
  }

  set(f: EnvField, x: number, y: number, v: number): void {
    if (!this.world.inBounds(x, y)) return;
    this[f][this.world.index(x, y)] = v;
  }

  /** Addiert amount (kann negativ sein). pollution und radiation fallen nie unter 0, water bleibt in 0..1. */
  add(f: EnvField, x: number, y: number, amount: number): void {
    if (!this.world.inBounds(x, y)) return;
    const arr = this[f];
    const i = this.world.index(x, y);
    let v = arr[i]! + amount;
    if (f === 'pollution' || f === 'radiation') v = Math.max(0, v);
    else if (f === 'water') v = Math.min(1, Math.max(0, v));
    arr[i] = v;
  }

  /** Summe über alle Kacheln (wird höchstens einmal pro Tick berechnet). */
  total(f: EnvField): number {
    this.refresh();
    return this.totals[f];
  }

  /** Durchschnitt über alle Kacheln. */
  average(f: EnvField): number {
    return this.total(f) / this[f].length;
  }

  /** Höchster Wert auf der Karte. */
  max(f: EnvField): number {
    this.refresh();
    return this.maxima[f];
  }

  private refresh(): void {
    if (this.cacheTick === this._tick) return;
    this.cacheTick = this._tick;
    for (const f of ENV_FIELDS) {
      const arr = this[f];
      let s = 0;
      let m = -Infinity;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i]!;
        s += v;
        if (v > m) m = v;
      }
      this.totals[f] = s;
      this.maxima[f] = m;
    }
  }
}
