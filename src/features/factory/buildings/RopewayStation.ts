// Seilbahn: Zwei Stationen verbinden sich automatisch (nächste freie Station in Reichweite).
// Items, die in eine Station geschoben werden (nicht von vorne), fahren zur Partnerstation
// und kommen dort vorne wieder heraus. Funktioniert in beide Richtungen.
import { BaseBuilding, TICKS_PER_SECOND, type BuildingDef, type BuildingInit, type Direction, type Game, type ItemId } from '../../../core';
import { BALANCE } from '../balance';
import { stationSet } from '../state';

const R = BALANCE.ropeway;
/** So viele angekommene Items warten höchstens am Ausgang */
const ARRIVED_CAP = 4;

interface Transit {
  item: ItemId;
  /** Tick, in dem die Gondel ankommt */
  arrive: number;
}

export class RopewayStation extends BaseBuilding {
  partner: RopewayStation | null = null;
  /** Items auf dem Weg ZU dieser Station */
  inFlight: Transit[] = [];
  private arrived: ItemId[] = [];

  constructor(init: BuildingInit) {
    super(init);
  }

  onPlace(): void {
    stationSet(this.game).add(this);
    this.tryPair();
  }

  onRemove(): void {
    stationSet(this.game).delete(this);
    const inv = this.game.inventory;
    for (const t of this.inFlight) inv.add(t.item, 1);
    for (const i of this.arrived) inv.add(i, 1);
    this.inFlight = [];
    this.arrived = [];
    const p = this.partner;
    if (p) {
      // Was zur Partnerstation unterwegs war, geht ebenfalls zurück
      for (const t of p.inFlight) inv.add(t.item, 1);
      p.inFlight = [];
      p.partner = null;
      this.partner = null;
      p.tryPair(); // vielleicht gibt es eine andere freie Station
    }
  }

  /** Verbindet mit der nächsten freien Station in Reichweite. */
  tryPair(): void {
    if (this.partner || this.removed) return;
    const me = this.center();
    let best: RopewayStation | null = null;
    let bestD = Infinity;
    for (const s of stationSet(this.game)) {
      if (s === this || s.partner || s.removed) continue;
      const c = s.center();
      const d = Math.hypot(c.x - me.x, c.y - me.y);
      if (d <= R.range && d < bestD) {
        best = s;
        bestD = d;
      }
    }
    if (best) {
      this.partner = best;
      best.partner = this;
    }
  }

  distance(): number {
    if (!this.partner) return 0;
    const a = this.center();
    const b = this.partner.center();
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  acceptItem(item: ItemId, from: Direction): boolean {
    if (from === this.dir) return false; // vorne kommt nur etwas heraus
    const p = this.partner;
    if (!p || p.inFlight.length >= R.capacity) return false;
    p.inFlight.push({ item, arrive: this.game.tickCount + Math.ceil((this.distance() / R.speed) * TICKS_PER_SECOND) });
    return true;
  }

  tick(): void {
    if (!this.partner && this.game.tickCount % 60 === 0) this.tryPair();
    const now = this.game.tickCount;
    while (this.inFlight.length > 0 && this.inFlight[0]!.arrive <= now && this.arrived.length < ARRIVED_CAP) {
      this.arrived.push(this.inFlight.shift()!.item);
    }
    if (this.arrived.length > 0 && this.pushForward(this.arrived[0]!)) this.arrived.shift();
  }

  info(): string[] {
    if (!this.partner) return ['Wartet auf eine zweite Station', `(Reichweite ${R.range} Kacheln)`];
    return [`Verbunden, Entfernung ${this.distance().toFixed(1)} Kacheln`, `Unterwegs hierher: ${this.inFlight.length}`, `Wartet am Ausgang: ${this.arrived.length}`];
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#6a5a3a';
    ctx.fillRect(-0.42, -0.42, 0.84, 0.84);
    ctx.strokeStyle = '#33291a';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.42, -0.42, 0.84, 0.84);
    // Seilrolle
    ctx.fillStyle = '#2c2c2c';
    ctx.beginPath();
    ctx.arc(0, 0, 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.partner ? '#c9c9c9' : '#777';
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, 0.14, time * (this.partner ? 3 : 0), time * (this.partner ? 3 : 0) + Math.PI * 1.4);
    ctx.stroke();
    // Ausgabepfeil
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -0.46);
    ctx.lineTo(0.14, -0.3);
    ctx.lineTo(-0.14, -0.3);
    ctx.closePath();
    ctx.fill();
  }
}

export const ROPEWAY_STATION_DEF: BuildingDef = {
  id: 'factory:ropeway_station',
  name: 'Seilbahn-Station',
  description: `Zwei Stationen (bis ${R.range} Kacheln auseinander) verbinden sich automatisch. Items hinein, Items am Ausgang (Pfeil) heraus.`,
  size: { w: 1, h: 1 },
  cost: { iron_plate: 10, steel: 5, circuit: 3 },
  requiresResearch: 'ropeway',
  maxHp: 80,
  color: '#6a5a3a',
  tags: [],
  rotatable: true,
  create: (init) => new RopewayStation(init),
};

/** Zeichnet Seile und Gondeln aller sichtbaren Verbindungen (Ebene 'items'). */
export function drawRopeways(game: Game, ctx: CanvasRenderingContext2D, view: { minX: number; minY: number; maxX: number; maxY: number }): void {
  for (const s of stationSet(game)) {
    const p = s.partner;
    if (!p || s.uid > p.uid) continue; // jede Verbindung nur einmal
    const a = s.center();
    const b = p.center();
    if (Math.max(a.x, b.x) < view.minX - 1 || Math.min(a.x, b.x) > view.maxX + 2 || Math.max(a.y, b.y) < view.minY - 1 || Math.min(a.y, b.y) > view.maxY + 2) continue;
    ctx.strokeStyle = 'rgba(30,30,30,0.85)';
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const total = Math.max(1, (s.distance() / R.speed) * TICKS_PER_SECOND);
    const gondola = (t: Transit, from: { x: number; y: number }, to: { x: number; y: number }) => {
      const f = Math.min(1, Math.max(0, 1 - (t.arrive - game.tickCount) / total));
      const x = from.x + (to.x - from.x) * f;
      const y = from.y + (to.y - from.y) * f;
      ctx.fillStyle = '#8b6b3e';
      ctx.fillRect(x - 0.14, y - 0.1, 0.28, 0.2);
      drawItemSafe(game, ctx, t.item, x, y);
    };
    for (const t of s.inFlight) gondola(t, b, a);
    for (const t of p.inFlight) gondola(t, a, b);
  }
}

function drawItemSafe(game: Game, ctx: CanvasRenderingContext2D, item: ItemId, x: number, y: number): void {
  const def = game.registries.items.get(item);
  ctx.fillStyle = def?.color ?? '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 0.07, 0, Math.PI * 2);
  ctx.fill();
}
