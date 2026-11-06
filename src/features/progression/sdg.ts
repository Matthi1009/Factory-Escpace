// SDG-Satire-Wertung: Wie stark verfehlt der Spieler die UN-Nachhaltigkeitsziele? 0–100 % je Ziel.
// Je höher die Verfehlung, desto mehr Geld (Multiplikator in economy.ts), desto mehr Demonstrationen.
import type { Game } from '../../core';
import { PROGRESSION_CONFIG } from './config';

const C = PROGRESSION_CONFIG.sdg;

export const SDG_GOALS = [
  { id: 'progression:sdg_3', label: 'SDG 3 – Gesundheit' },
  { id: 'progression:sdg_6', label: 'SDG 6 – Sauberes Wasser' },
  { id: 'progression:sdg_7', label: 'SDG 7 – Saubere Energie' },
  { id: 'progression:sdg_13', label: 'SDG 13 – Klimaschutz' },
  { id: 'progression:sdg_15', label: 'SDG 15 – Leben an Land' },
] as const;
export const STAT_SDG_TOTAL = 'progression:sdg_total';

/** 0..100 % aus einem Messwert und seiner Skala */
function failure(x: number): number {
  return 100 * (1 - Math.exp(-Math.max(0, x)));
}

export class SdgTracker {
  /** Verfehlung je Ziel und gesamt (0..100), wird einmal pro Sekunde aktualisiert */
  readonly values = new Map<string, number>();
  total = 0;
  private waterBaseline = 0;

  constructor(private game: Game) {
    for (const g of SDG_GOALS) game.stats.define({ id: g.id, label: g.label, unit: '%', group: 'sdg' });
    game.stats.define({ id: STAT_SDG_TOTAL, label: 'SDG-Verfehlung gesamt', unit: '%', group: 'sdg' });
    game.events.on('ready', () => {
      this.waterBaseline = game.env.total('water');
      this.update();
    });
  }

  update(): void {
    const { env, world } = this.game;
    const pollution = env.total('pollution');
    const tempDev = Math.abs(env.average('temperature') - 20);
    const waterDeficit = Math.max(0, this.waterBaseline - env.total('water'));
    const radiation = env.total('radiation');
    const smog = env.field('pollution');
    let smogTiles = 0;
    for (let i = 0; i < smog.length; i++) if (smog[i]! > C.smogTileMin) smogTiles++;
    const producers = world.buildingsWithTag('power_producer');
    const dirty = producers.filter((b) => !b.def.tags.includes('eco')).length;

    this.set('progression:sdg_3', failure(radiation / C.radiation));
    this.set('progression:sdg_6', failure(waterDeficit / C.waterDeficit));
    this.set('progression:sdg_7', producers.length ? (100 * dirty) / producers.length : 0);
    this.set('progression:sdg_13', failure(pollution / C.climatePollution + tempDev / C.climateTemperature));
    this.set('progression:sdg_15', failure(smogTiles / C.smogTiles));
    let sum = 0;
    for (const g of SDG_GOALS) sum += this.values.get(g.id)!;
    this.total = sum / SDG_GOALS.length;
    this.game.stats.set(STAT_SDG_TOTAL, round1(this.total));
  }

  private set(id: string, v: number): void {
    this.values.set(id, v);
    this.game.stats.set(id, round1(v));
  }
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
