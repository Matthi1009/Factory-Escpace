// Lager: nimmt alles an (bis zur Kapazität), Greifarme können daraus entnehmen.
// (Anders als core:chest, das alles ins globale Inventar leitet.)
import { BaseBuilding, type BuildingDef, type BuildingInit, type ItemId } from '../../../core';
import type { Pullable } from '../transfer';

/** Obergrenze pro Item-Sorte: eine Sorte kann das Lager nicht für alle anderen blockieren */
const PER_ITEM_CAP = 100;

export class Crate extends BaseBuilding implements Pullable {
  private stock = new Map<ItemId, number>();
  private total = 0;

  constructor(init: BuildingInit) {
    super(init);
  }

  wouldAccept(item: ItemId): boolean {
    return (this.stock.get(item) ?? 0) < PER_ITEM_CAP;
  }

  acceptItem(item: ItemId): boolean {
    if (!this.wouldAccept(item)) return false;
    this.stock.set(item, (this.stock.get(item) ?? 0) + 1);
    this.total++;
    return true;
  }

  peekItem(accept?: (item: ItemId) => boolean): ItemId | null {
    for (const [item, n] of this.stock) if (n > 0 && (!accept || accept(item))) return item;
    return null;
  }

  takeItem(accept?: (item: ItemId) => boolean): ItemId | null {
    const item = this.peekItem(accept);
    if (item === null) return null;
    const n = this.stock.get(item)! - 1;
    if (n <= 0) this.stock.delete(item);
    else this.stock.set(item, n);
    this.total--;
    return item;
  }

  onRemove(): void {
    for (const [item, n] of this.stock) this.game.inventory.add(item, n);
    this.stock.clear();
    this.total = 0;
  }

  info(): string[] {
    const names = this.game.registries.items;
    const lines = [`Inhalt: ${this.total} (max. ${PER_ITEM_CAP} je Sorte)`];
    let shown = 0;
    for (const [item, n] of this.stock) {
      if (shown++ >= 4) {
        lines.push('…');
        break;
      }
      lines.push(`${n}× ${names.get(item)?.name ?? item}`);
    }
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8b6b3e';
    ctx.fillRect(-0.4, -0.4, 0.8, 0.8);
    ctx.strokeStyle = '#4e3a1c';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.4, -0.4, 0.8, 0.8);
    ctx.beginPath();
    ctx.moveTo(-0.4, -0.4);
    ctx.lineTo(0.4, 0.4);
    ctx.moveTo(0.4, -0.4);
    ctx.lineTo(-0.4, 0.4);
    ctx.stroke();
    // Füllstand
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-0.4, 0.46, 0.8 * Math.min(1, this.total / (PER_ITEM_CAP * 2)), 0.06);
  }
}

export const CRATE_DEF: BuildingDef = {
  id: 'factory:crate',
  name: 'Lagerkiste',
  description: 'Lagert bis zu 100 Items je Sorte. Greifarme können daraus entnehmen.',
  size: { w: 1, h: 1 },
  cost: { iron_plate: 2 },
  maxHp: 80,
  color: '#8b6b3e',
  tags: ['storage'],
  rotatable: false,
  create: (init) => new Crate(init),
};
