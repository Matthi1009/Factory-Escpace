// Pflanzen sterben: Gras- und Waldkacheln verändern sich je nach Umwelt (und erholen sich, wenn es besser wird).
// grass/forest → dry → dead → wasteland; toxic bei Strahlung; ice bei Kälte. Ausgetrocknete Seen werden zu Sand.
// Pro Sekunde wird nur ein Streifen der Karte geprüft (Performance). Eigene Boden-Optik per setGroundPainter.
import {
  defaultGroundPainter,
  hash2,
  TERRAIN_INDEX,
  TICKS_PER_SECOND,
  type Game,
  type GroundPainter,
  type TerrainId,
} from '../../core';
import { ENV_CONFIG } from './config';

const C = ENV_CONFIG.terrain;
export const STAT_DEAD_LAND = 'environment:dead_land';

const T = TERRAIN_INDEX;

export class TerrainChanger {
  /** Terrain bei Spielstart (damit sich Natur wieder erholen kann) */
  readonly original: Uint8Array;
  /** Wird aufgerufen, wenn sich Wasserflächen geändert haben (Wegfindung neu berechnen) */
  onWaterChanged: (() => void) | null = null;
  private part = 0;
  private plantTiles = 0;

  constructor(private game: Game) {
    this.original = game.world.terrain.slice();
    for (const t of this.original) if (t === T.grass || t === T.forest) this.plantTiles++;
    game.stats.define({ id: STAT_DEAD_LAND, label: 'Abgestorbene Natur', unit: '%', group: 'environment' });
    game.stats.set(STAT_DEAD_LAND, 0);
    game.renderer.setGroundPainter(this.painter);
    game.onTick((g) => {
      if (g.tickCount % TICKS_PER_SECOND === 20) this.scan();
    });
  }

  /** Gewünschtes Terrain einer Gras-/Waldkachel aus den Umweltwerten. */
  private desired(i: number, orig: number): number {
    const env = this.game.env;
    const p = env.pollution[i]!;
    const t = env.temperature[i]!;
    const w = env.water[i]!;
    if (env.radiation[i]! > C.toxicRadiation) return T.toxic;
    if (t < C.iceTemperature) return T.ice;
    if (p > C.wastelandPollution) return T.wasteland;
    if (p > C.deadPollution || w < C.deadWater) return T.dead;
    if (w < C.dryWater || t > C.dryTemperature || p > C.dryPollution) return T.dry;
    return orig;
  }

  /** Prüft den nächsten Streifen der Karte. */
  scan(): void {
    const { world } = this.game;
    const w = world.width;
    const rows = Math.ceil(world.height / C.scanParts);
    const y0 = this.part * rows;
    const y1 = Math.min(world.height, y0 + rows);
    this.part = (this.part + 1) % C.scanParts;
    const changed: number[] = [];
    let waterChanged = false;
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const orig = this.original[i]!;
        const cur = world.terrain[i]!;
        let next = cur;
        if (orig === T.grass || orig === T.forest) {
          next = this.desired(i, orig);
        } else if (orig === T.water) {
          next = this.lakeState(x, y, cur);
          if (next !== cur) waterChanged = true;
        }
        if (next !== cur) {
          world.terrain[i] = next;
          changed.push(i);
        }
      }
    }
    if (changed.length > 300) {
      this.game.renderer.invalidateGround(0, y0, w, y1 - y0);
    } else {
      for (const i of changed) this.game.renderer.invalidateGround(i % w, Math.floor(i / w), 1, 1);
    }
    if (waterChanged) this.onWaterChanged?.();
    if (this.part === 0) this.updateStat();
  }

  /** See trocknet aus, wenn ringsum alles staubtrocken ist – und füllt sich wieder, wenn es feucht wird. */
  private lakeState(x: number, y: number, cur: number): number {
    const { world, env } = this.game;
    let dryLand = 0;
    let wetLand = 0;
    for (const n of world.neighbors4(x, y)) {
      if (world.terrain[world.index(n.x, n.y)] === T.water) continue;
      const wv = env.get('water', n.x, n.y);
      if (wv < C.lakeDryWater) dryLand++;
      else if (wv > 0.4) wetLand++;
    }
    if (cur === T.water && dryLand >= C.lakeDryNeighbors) {
      env.set('water', x, y, 0.2);
      return T.sand;
    }
    if (cur === T.sand && wetLand >= 3) {
      env.set('water', x, y, 1);
      return T.water;
    }
    return cur;
  }

  private updateStat(): void {
    const terrain = this.game.world.terrain;
    let dead = 0;
    for (let i = 0; i < terrain.length; i++) {
      const t = terrain[i]!;
      if (t === T.dead || t === T.wasteland || t === T.toxic) dead++;
    }
    this.game.stats.set(STAT_DEAD_LAND, this.plantTiles ? Math.round((1000 * dead) / this.plantTiles) / 10 : 0);
  }

  /** Boden-Optik: Standard + tote Bäume, Risse, Giftblasen, Eiskristalle. */
  private painter: GroundPainter = (ctx, x, y, px, py, size, world) => {
    defaultGroundPainter(ctx, x, y, px, py, size, world);
    const i = world.index(x, y);
    const s = size / 8;
    const h = hash2(world.seed + 99, x, y);
    const id: TerrainId | null = world.getTerrain(x, y);
    switch (id) {
      case 'dead':
        if (this.original[i] === T.forest) {
          // toter Baum: kahler Stamm mit Ästen
          ctx.fillStyle = '#3b3027';
          ctx.fillRect(px + s * 3, py + s * 2, s, s * 5);
          ctx.fillRect(px + s * 2, py + s * 3, s, s);
          ctx.fillRect(px + s * 4, py + s * 2, s, s);
        } else if (h < 0.4) {
          ctx.fillStyle = '#4e4433';
          ctx.fillRect(px + s * Math.floor(h * 15), py + s * 5, s * 2, s);
        }
        break;
      case 'dry':
        if (h < 0.5) {
          ctx.fillStyle = 'rgba(80,60,30,0.45)';
          ctx.fillRect(px + s, py + s * Math.floor(2 + h * 8), s * 4, s * 0.6);
        }
        break;
      case 'wasteland':
        ctx.fillStyle = 'rgba(25,20,18,0.55)';
        ctx.fillRect(px + s * Math.floor(h * 5), py, s * 0.7, size);
        if (h > 0.5) ctx.fillRect(px, py + s * Math.floor(h * 7), size, s * 0.7);
        break;
      case 'toxic':
        ctx.fillStyle = '#b6ff3d';
        ctx.fillRect(px + s * Math.floor(h * 6), py + s * Math.floor(((h * 7) % 1) * 6), s * 2, s * 2);
        if (h > 0.6) {
          ctx.fillStyle = '#e8ff9a';
          ctx.fillRect(px + s * 5, py + s * 2, s, s);
        }
        break;
      case 'ice':
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + s * Math.floor(h * 6), py + s * 2, s, s);
        ctx.fillRect(px + s * 2, py + s * Math.floor(h * 6), s, s);
        break;
      default:
        break;
    }
  };
}
