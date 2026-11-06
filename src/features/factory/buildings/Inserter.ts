// Greifarm: nimmt ein Item aus dem Gebäude hinter sich (Band, Maschinenausgang, Kiste)
// und setzt es in das Gebäude vor sich. Ohne Strom, ca. 2 Items pro Sekunde.
import { BaseBuilding, drawItem, opposite, type BuildingDef, type BuildingInit, type ItemId } from '../../../core';
import { asPullable, targetWouldAccept } from '../transfer';
import { BALANCE } from '../balance';

/** Ticks für einen Schwung vom Quell- zum Zielgebäude */
const SWING_TICKS = BALANCE.inserter.swingTicks;

export class Inserter extends BaseBuilding {
  private held: ItemId | null = null;
  /** Armstellung: 0 = hinten (Quelle), 1 = vorne (Ziel) */
  private t = 0;

  constructor(init: BuildingInit) {
    super(init);
  }

  tick(): void {
    if (this.held === null) {
      if (this.t > 0) {
        this.t = Math.max(0, this.t - 1 / SWING_TICKS); // Arm schwingt zurück
        return;
      }
      const source = asPullable(this.neighborBuilding(opposite(this.dir)));
      const target = this.buildingInFront();
      if (!source || !target || !target.acceptItem) return;
      // Nur ein Item nehmen, das das Ziel gerade annimmt (sonst blockiert z. B. ein gemischtes Lager)
      const accept = (it: ItemId) => targetWouldAccept(target, it, opposite(this.dir));
      if (source.peekItem(accept) === null) return;
      this.held = source.takeItem(accept);
    }
    if (this.held === null) return;
    if (this.t < 1) {
      this.t = Math.min(1, this.t + 1 / SWING_TICKS);
      return;
    }
    if (this.pushForward(this.held)) this.held = null;
  }

  info(): string[] {
    if (this.held === null) return ['Wartet auf ein Item'];
    const name = this.game.registries.items.get(this.held)?.name ?? this.held;
    return [`Hält: ${name}`, this.t >= 1 ? 'Ziel nimmt nicht an' : 'Schwenkt'];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#4a4f57';
    ctx.fillRect(-0.3, -0.3, 0.6, 0.6);
    // Arm: von hinten (a = π) nach vorne (a = 0); „vorne“ ist oben (−y)
    const a = Math.PI * (1 - this.t);
    const tipX = Math.sin(a) * 0.62;
    const tipY = -Math.cos(a) * 0.62;
    ctx.strokeStyle = '#d6a21e';
    ctx.lineWidth = 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.fillStyle = '#d6a21e';
    ctx.beginPath();
    ctx.arc(0, 0, 0.1, 0, Math.PI * 2);
    ctx.fill();
    if (this.held !== null) drawItem(ctx, this.held, tipX, tipY, 0.26);
  }
}

export const INSERTER_DEF: BuildingDef = {
  id: 'factory:inserter',
  name: 'Greifarm',
  description: 'Nimmt Items aus dem Gebäude hinter sich und setzt sie in das Gebäude davor.',
  size: { w: 1, h: 1 },
  cost: { iron_plate: 2, gear: 1 },
  requiresResearch: 'logistics',
  maxHp: 40,
  color: '#4a4f57',
  tags: [],
  rotatable: true,
  create: (init) => new Inserter(init),
};
