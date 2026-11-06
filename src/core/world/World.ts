// Die Spielwelt: 256×256 Kacheln. x nach rechts, y nach unten, 1 Kachel = 1 Welteinheit.
// Pro Kachel: Terrain, Ressource (oder null) und das Gebäude, das sie belegt (oder null).
import type { Building } from '../buildings/Building';
import type { BuildingTag } from '../content/tags';
import { RESOURCES, type ResourceId } from '../content/resources';
import { TERRAINS, TERRAIN_INDEX, type TerrainDef, type TerrainId } from '../content/terrain';
import { dirVec, DIRECTIONS, type Direction } from '../direction';

export const WORLD_SIZE = 256;

export interface TilePos {
  x: number;
  y: number;
}

export class World {
  readonly width = WORLD_SIZE;
  readonly height = WORLD_SIZE;
  /** Mittelpunkt der Karte; hier liegt das Raumschiff-Wrack. */
  readonly spawn: TilePos = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };

  /** Terrain-Index pro Kachel (siehe TERRAINS). Direkter Zugriff erlaubt, sonst getTerrain/setTerrain. */
  readonly terrain = new Uint8Array(WORLD_SIZE * WORLD_SIZE);
  /** Ressource pro Kachel: 0 = keine, sonst Index in RESOURCES + 1. */
  readonly resource = new Uint8Array(WORLD_SIZE * WORLD_SIZE);

  private grid: (Building | null)[] = new Array(WORLD_SIZE * WORLD_SIZE).fill(null);
  private list: Building[] = [];
  private listDirty = false;

  constructor(readonly seed: number) {}

  // ---------- Kacheln ----------

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height && Number.isInteger(x) && Number.isInteger(y);
  }

  /** Index ins Kachel-Array (auch für env-Arrays). Nur für gültige Koordinaten. */
  index(x: number, y: number): number {
    return y * this.width + x;
  }

  getTerrain(x: number, y: number): TerrainId | null {
    if (!this.inBounds(x, y)) return null;
    return TERRAINS[this.terrain[this.index(x, y)]!]!.id;
  }

  getTerrainDef(x: number, y: number): TerrainDef | null {
    if (!this.inBounds(x, y)) return null;
    return TERRAINS[this.terrain[this.index(x, y)]!]!;
  }

  /** Ändert das Terrain. Danach game.renderer.invalidateGround(x, y) aufrufen, damit es sichtbar wird. */
  setTerrain(x: number, y: number, t: TerrainId): void {
    if (!this.inBounds(x, y)) return;
    this.terrain[this.index(x, y)] = TERRAIN_INDEX[t];
  }

  getResource(x: number, y: number): ResourceId | null {
    if (!this.inBounds(x, y)) return null;
    const r = this.resource[this.index(x, y)]!;
    return r === 0 ? null : RESOURCES[r - 1]!.id;
  }

  setResource(x: number, y: number, r: ResourceId | null): void {
    if (!this.inBounds(x, y)) return;
    this.resource[this.index(x, y)] = r === null ? 0 : RESOURCES.findIndex((d) => d.id === r) + 1;
  }

  isBuildable(x: number, y: number): boolean {
    const t = this.getTerrainDef(x, y);
    return !!t && t.buildable;
  }

  // ---------- Nachbarn & Bereiche ----------

  /** Nachbarkachel in Richtung dir (kann außerhalb der Karte liegen → inBounds prüfen). */
  neighbor(x: number, y: number, dir: Direction): TilePos {
    const v = dirVec(dir);
    return { x: x + v.dx, y: y + v.dy };
  }

  /** Die 4 Nachbarn innerhalb der Karte, jeweils mit Richtung (von (x,y) aus gesehen). */
  neighbors4(x: number, y: number): (TilePos & { dir: Direction })[] {
    const out: (TilePos & { dir: Direction })[] = [];
    for (const dir of DIRECTIONS) {
      const n = this.neighbor(x, y, dir);
      if (this.inBounds(n.x, n.y)) out.push({ ...n, dir });
    }
    return out;
  }

  /** Die bis zu 8 Nachbarn innerhalb der Karte. */
  neighbors8(x: number, y: number): TilePos[] {
    const out: TilePos[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && this.inBounds(x + dx, y + dy)) out.push({ x: x + dx, y: y + dy });
      }
    return out;
  }

  /** Ruft fn für jede Kachel im Kreis (euklidisch) auf, nur innerhalb der Karte. */
  forEachInRadius(cx: number, cy: number, r: number, fn: (x: number, y: number, dist: number) => void): void {
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(this.width - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(this.height - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) fn(x, y, d);
      }
  }

  // ---------- Gebäude ----------

  getBuilding(x: number, y: number): Building | null {
    if (!this.inBounds(x, y)) return null;
    return this.grid[this.index(x, y)]!;
  }

  /** Alle Gebäude (Platzierungs-Reihenfolge). Nicht verändern! */
  allBuildings(): readonly Building[] {
    if (this.listDirty) {
      this.list = this.list.filter((b) => !b.removed);
      this.listDirty = false;
    }
    return this.list;
  }

  buildingsWithTag(tag: BuildingTag): Building[] {
    return this.allBuildings().filter((b) => b.def.tags.includes(tag));
  }

  buildingsOfType(defId: string): Building[] {
    return this.allBuildings().filter((b) => b.def.id === defId);
  }

  /** Gebäude, deren Mittelpunkt im Radius um (cx, cy) liegt. */
  buildingsInRadius(cx: number, cy: number, r: number): Building[] {
    return this.allBuildings().filter((b) => {
      const c = b.center();
      return Math.hypot(c.x - cx, c.y - cy) <= r;
    });
  }

  /** Sind alle Kacheln des Rechtecks frei, baubar und in der Karte? */
  isAreaFree(x: number, y: number, w: number, h: number): boolean {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) {
        if (!this.inBounds(xx, yy) || this.grid[this.index(xx, yy)] || !this.isBuildable(xx, yy)) return false;
      }
    return true;
  }

  /** @internal Nur Game benutzt das. */
  _occupy(b: Building): void {
    for (let yy = b.y; yy < b.y + b.def.size.h; yy++)
      for (let xx = b.x; xx < b.x + b.def.size.w; xx++) this.grid[this.index(xx, yy)] = b;
    this.list.push(b);
  }

  /** @internal Nur Game benutzt das. */
  _release(b: Building): void {
    for (let yy = b.y; yy < b.y + b.def.size.h; yy++)
      for (let xx = b.x; xx < b.x + b.def.size.w; xx++) {
        const i = this.index(xx, yy);
        if (this.grid[i] === b) this.grid[i] = null;
      }
    this.listDirty = true;
  }
}
