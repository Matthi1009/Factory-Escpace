// Debug-Gebäude debug:source: Gibt regelmäßig ein wählbares Item nach vorne aus.
// Zum Testen von Bändern, Öfen usw. ohne Abbau. Item im F1-Debugpanel wählen.
import type { ItemId } from '../defs';
import { BaseBuilding, type BuildingDef, type BuildingInit } from './Building';
import { drawItem } from '../render/drawItem';

export class DebugSource extends BaseBuilding {
  /** Item, das neue Quellen ausgeben (setzt das Debugpanel). */
  static defaultItem: ItemId = 'iron_ore';
  /** Ticks zwischen zwei Items (10 → 6 Items/s). */
  static interval = 10;

  item: ItemId;
  private cooldown = 0;
  /** Ein Item, das vorne nicht angenommen wurde, wird gehalten, bis es passt. */
  private held: ItemId | null = null;

  constructor(init: BuildingInit) {
    super(init);
    this.item = DebugSource.defaultItem;
  }

  tick(): void {
    if (this.cooldown > 0) this.cooldown--;
    if (this.held === null && this.cooldown === 0) {
      this.held = this.item;
      this.cooldown = DebugSource.interval;
    }
    if (this.held !== null && this.pushForward(this.held)) this.held = null;
  }

  info(): string[] {
    return [`Gibt aus: ${this.game.registries.items.get(this.item)?.name ?? this.item}`];
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#5b2a86';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = `hsl(${(time * 120) % 360}, 90%, 65%)`;
    ctx.lineWidth = 0.06;
    ctx.strokeRect(-0.4, -0.4, 0.8, 0.8);
    // Ausgabe-Pfeil nach vorne
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -0.46);
    ctx.lineTo(0.16, -0.28);
    ctx.lineTo(-0.16, -0.28);
    ctx.closePath();
    ctx.fill();
    drawItem(ctx, this.item, 0, 0.05, 0.4);
  }
}

export const DEBUG_SOURCE_DEF: BuildingDef = {
  id: 'debug:source',
  name: 'Debug-Quelle',
  description: 'Gibt ein im Debugpanel gewähltes Item nach vorne aus.',
  size: { w: 1, h: 1 },
  cost: {},
  maxHp: 1000,
  color: '#5b2a86',
  tags: [],
  hidden: true,
  create: (init) => new DebugSource(init),
};
