// Abbaumaschine: nur auf Erz baubar, baut das Erz unter sich ab und gibt es nach vorne aus.
import { BaseBuilding, type BuildingDef, type BuildingInit, type Game, type ItemId } from '../../../core';

/** Ticks pro Erz (120 → 0,5 Erz/s) */
const MINE_TICKS = 120;
/** So viele Erze werden maximal gepuffert, bevor die Maschine wartet */
const MAX_BUFFER = 3;

export class Miner extends BaseBuilding {
  private progress = 0;
  private buffer = 0;
  private ore: ItemId | null;

  constructor(init: BuildingInit) {
    super(init);
    this.ore = this.resourceUnder();
  }

  tick(): void {
    if (!this.ore) return;
    // Ausgabe zuerst, damit der Puffer sich leert
    if (this.buffer > 0 && this.pushForward(this.ore)) this.buffer--;
    if (this.buffer >= MAX_BUFFER) return;
    this.progress++;
    if (this.progress >= MINE_TICKS) {
      this.progress = 0;
      this.buffer++;
    }
  }

  info(): string[] {
    const name = this.ore ? (this.game.registries.items.get(this.ore)?.name ?? this.ore) : 'kein Erz';
    const lines = [`Baut ab: ${name}`, `Fortschritt: ${Math.round((this.progress / MINE_TICKS) * 100)} %`];
    if (this.buffer > 0) lines.push(`Puffer: ${this.buffer}/${MAX_BUFFER}${this.buffer >= MAX_BUFFER ? ' (Ausgang blockiert)' : ''}`);
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#5a5f66';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#2d3035';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    // drehender Bohrkopf
    ctx.save();
    ctx.rotate(this.active && this.buffer < MAX_BUFFER ? time * 6 : 0);
    ctx.fillStyle = '#d6a21e';
    ctx.fillRect(-0.25, -0.06, 0.5, 0.12);
    ctx.fillRect(-0.06, -0.25, 0.12, 0.5);
    ctx.restore();
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

export const MINER_DEF: BuildingDef = {
  id: 'factory:miner',
  name: 'Abbaumaschine',
  description: 'Baut das Erz unter sich ab und gibt es nach vorne aus. Nur auf Erz baubar.',
  size: { w: 1, h: 1 },
  cost: { iron_plate: 6, gear: 2 },
  maxHp: 80,
  color: '#5a5f66',
  tags: [],
  rotatable: true,
  canPlace: (game: Game, x: number, y: number) => game.world.getResource(x, y) !== null || 'Nur auf Erz baubar',
  create: (init) => new Miner(init),
};
