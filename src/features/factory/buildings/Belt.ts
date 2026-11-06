// Förderband: nimmt Items von hinten und von den Seiten an, transportiert sie und gibt sie vorne ab.
import { BaseBuilding, dirVec, opposite, type BuildingDef, type BuildingInit, type Direction, type Game, type ItemId, drawItem } from '../../../core';
import { beltSet } from '../state';

/** Fortschritt pro Tick (0..1 pro Kachel) → 0,03 · 60 = 1,8 Kacheln/s */
const SPEED = 0.03;
/** Mindestabstand zwischen zwei Items auf einem Band */
const GAP = 0.25;
/** Seiteneinstieg: Item startet seitlich versetzt und gleitet zur Mitte */
const SIDE_START_PROGRESS = 0.2;
const LATERAL_SPEED = 0.05;

interface BeltItem {
  item: ItemId;
  /** 0 = Bandanfang, 1 = Bandende */
  p: number;
  /** Wert beim letzten Tick (für weiche Darstellung) */
  prev: number;
  /** seitlicher Versatz 0..0.5 in Richtung latDir */
  lat: number;
  prevLat: number;
  latDir: Direction;
}

export class Belt extends BaseBuilding {
  /** Items, das vorderste zuerst (größtes p) */
  readonly items: BeltItem[] = [];

  constructor(init: BuildingInit) {
    super(init);
  }

  onPlace(): void {
    beltSet(this.game).add(this);
  }

  onRemove(): void {
    beltSet(this.game).delete(this);
    // Items zurückgeben statt verlieren
    for (const it of this.items) this.game.inventory.add(it.item, 1);
    this.items.length = 0;
  }

  acceptItem(item: ItemId, from: Direction): boolean {
    if (from === this.dir) return false; // von vorne wird nichts angenommen
    const behind = from === opposite(this.dir);
    const p = behind ? 0 : SIDE_START_PROGRESS;
    // genug Platz am Einstieg?
    for (const it of this.items) if (Math.abs(it.p - p) < GAP) return false;
    const entry: BeltItem = { item, p, prev: p, lat: behind ? 0 : 0.5, prevLat: behind ? 0 : 0.5, latDir: from };
    // sortiert einfügen (vorderstes zuerst)
    let i = 0;
    while (i < this.items.length && this.items[i]!.p > p) i++;
    this.items.splice(i, 0, entry);
    return true;
  }

  tick(): void {
    let ahead = Infinity; // p des Items davor
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i]!;
      it.prev = it.p;
      it.prevLat = it.lat;
      it.p = Math.min(it.p + SPEED, ahead - GAP);
      if (it.p < it.prev) it.p = it.prev; // nie rückwärts
      if (it.lat > 0) it.lat = Math.max(0, it.lat - LATERAL_SPEED);
      if (it.p >= 1) {
        it.p = 1;
        if (this.pushForward(it.item)) {
          this.items.splice(i, 1);
          i--;
          continue;
        }
      }
      ahead = it.p;
    }
  }

  info(): string[] {
    const n = this.items.length;
    return [n === 0 ? 'Leer' : `Items auf dem Band: ${n}`];
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    // ctx: Mitte = (0,0), vorne = oben
    ctx.fillStyle = '#3b3f45';
    ctx.fillRect(-0.5, -0.5, 1, 1);
    ctx.fillStyle = '#2a2d31';
    ctx.fillRect(-0.5, -0.5, 0.1, 1);
    ctx.fillRect(0.4, -0.5, 0.1, 1);
    // laufende Pfeile als Bewegungsanzeige
    ctx.fillStyle = '#6d7480';
    const off = (time * SPEED * 60) % 0.5;
    for (let k = 0; k < 3; k++) {
      const y = 0.5 - off - k * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y - 0.12);
      ctx.lineTo(0.18, y + 0.06);
      ctx.lineTo(-0.18, y + 0.06);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export const BELT_DEF: BuildingDef = {
  id: 'factory:belt',
  name: 'Förderband',
  description: 'Transportiert Items. Nimmt von hinten und von den Seiten an.',
  size: { w: 1, h: 1 },
  cost: { iron_plate: 1 },
  maxHp: 40,
  color: '#3b3f45',
  tags: [],
  rotatable: true,
  create: (init) => new Belt(init),
};

/** Zeichnet die Items aller sichtbaren Bänder (Ebene 'items'). */
export function drawBeltItems(game: Game, ctx: CanvasRenderingContext2D, view: { minX: number; minY: number; maxX: number; maxY: number; alpha: number }): void {
  for (const belt of beltSet(game)) {
    if (belt.x < view.minX - 1 || belt.x > view.maxX + 1 || belt.y < view.minY - 1 || belt.y > view.maxY + 1) continue;
    const { dx, dy } = dirVec(belt.dir);
    for (const it of belt.items) {
      const p = it.prev + (it.p - it.prev) * view.alpha - 0.5;
      const lat = it.prevLat + (it.lat - it.prevLat) * view.alpha;
      const l = dirVec(it.latDir);
      drawItem(ctx, it.item, belt.x + 0.5 + dx * p + l.dx * lat, belt.y + 0.5 + dy * p + l.dy * lat, 0.28);
    }
  }
}
