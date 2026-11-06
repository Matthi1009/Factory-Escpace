// Flow-Field (Dijkstra) zum Wrack: Für jede Kachel die Wegkosten bis zum Wrack.
// Monster laufen immer zur Nachbarkachel mit den geringsten Kosten.
// Wasser ist unpassierbar. Gebäude sind passierbar, aber teuer – Monster greifen sie an, statt weite Umwege zu laufen.
import type { Game } from '../../../core';
import { ENV_CONFIG } from '../config';

export class FlowField {
  /** Kosten bis zum Ziel pro Kachel (Infinity = unerreichbar) */
  readonly dist: Float32Array;
  private dirty = true;
  private heapIdx: Int32Array;
  private heapCost: Float32Array;

  constructor(private game: Game) {
    const n = game.world.width * game.world.height;
    this.dist = new Float32Array(n).fill(Infinity);
    this.heapIdx = new Int32Array(n * 4);
    this.heapCost = new Float32Array(n * 4);
    const mark = () => (this.dirty = true);
    game.events.on('buildingPlaced', mark);
    game.events.on('buildingRemoved', mark);
    game.events.on('buildingDestroyed', mark);
    game.events.on('ready', mark);
  }

  /** Beim nächsten Update neu berechnen (z. B. wenn Seen ausgetrocknet sind) */
  markDirty(): void {
    this.dirty = true;
  }

  /** Neu berechnen, falls sich Gebäude geändert haben (höchstens alle fieldRecalcTicks). */
  update(): void {
    if (!this.dirty || this.game.tickCount % ENV_CONFIG.monsters.fieldRecalcTicks !== 0) return;
    this.dirty = false;
    this.recalc();
  }

  recalc(): void {
    const { world, wreck } = this.game;
    const w = world.width;
    const dist = this.dist;
    dist.fill(Infinity);
    if (!wreck || wreck.removed) return;
    let size = 0;
    const push = (i: number, c: number) => {
      // Binärer Min-Heap
      let k = size++;
      while (k > 0) {
        const parent = (k - 1) >> 1;
        if (this.heapCost[parent]! <= c) break;
        this.heapIdx[k] = this.heapIdx[parent]!;
        this.heapCost[k] = this.heapCost[parent]!;
        k = parent;
      }
      this.heapIdx[k] = i;
      this.heapCost[k] = c;
    };
    const pop = (): number => {
      const top = this.heapIdx[0]!;
      const lastI = this.heapIdx[--size]!;
      const lastC = this.heapCost[size]!;
      let k = 0;
      for (;;) {
        let c = 2 * k + 1;
        if (c >= size) break;
        if (c + 1 < size && this.heapCost[c + 1]! < this.heapCost[c]!) c++;
        if (this.heapCost[c]! >= lastC) break;
        this.heapIdx[k] = this.heapIdx[c]!;
        this.heapCost[k] = this.heapCost[c]!;
        k = c;
      }
      this.heapIdx[k] = lastI;
      this.heapCost[k] = lastC;
      return top;
    };

    for (let y = wreck.y; y < wreck.y + wreck.def.size.h; y++)
      for (let x = wreck.x; x < wreck.x + wreck.def.size.w; x++) {
        const i = world.index(x, y);
        dist[i] = 0;
        push(i, 0);
      }

    const buildingCost = ENV_CONFIG.monsters.buildingCost;
    while (size > 0) {
      const cost = this.heapCost[0]!;
      const i = pop();
      if (cost > dist[i]!) continue;
      const x = i % w;
      const y = (i - x) / w;
      for (let k = 0; k < 4; k++) {
        const nx = k === 0 ? x + 1 : k === 1 ? x - 1 : x;
        const ny = k === 2 ? y + 1 : k === 3 ? y - 1 : y;
        if (!world.inBounds(nx, ny)) continue;
        if (world.getTerrain(nx, ny) === 'water') continue;
        const ni = world.index(nx, ny);
        const step = world.getBuilding(nx, ny) ? buildingCost : 1;
        const nc = cost + step;
        if (nc < dist[ni]!) {
          dist[ni] = nc;
          push(ni, nc);
        }
      }
    }
  }

  get(x: number, y: number): number {
    return this.game.world.inBounds(x, y) ? this.dist[this.game.world.index(x, y)]! : Infinity;
  }
}
