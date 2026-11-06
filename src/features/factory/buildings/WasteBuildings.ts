// Müll-Gebäude: Müllkippe (gratis, verschmutzt) und Entsorgungsanlage (kostet Geld, sauber).
import { BALANCE } from '../balance';
import { needsConcreteResearch } from '../research';
import { BaseBuilding, type BuildingDef, type BuildingInit, type Direction, type ItemId } from '../../../core';

const WASTE_ITEMS = new Set<ItemId>(['waste', 'nuclear_waste']);
/** Verschmutzung pro abgekipptem Müll (Richtwert der Doku) */
const DUMP_POLLUTION = BALANCE.waste.dumpPollution;
/** Strahlung pro abgekipptem Atommüll */
const DUMP_RADIATION = BALANCE.waste.dumpRadiation;
/** Entsorgungskosten in € */
const DISPOSAL_COST = BALANCE.waste.disposalCost;

export class Dump extends BaseBuilding {
  private dumped = 0;

  constructor(init: BuildingInit) {
    super(init);
  }

  acceptItem(item: ItemId, _from: Direction): boolean {
    if (!WASTE_ITEMS.has(item)) return false;
    this.game.env.add('pollution', this.x, this.y, DUMP_POLLUTION);
    if (item === 'nuclear_waste') this.game.env.add('radiation', this.x, this.y, DUMP_RADIATION);
    this.dumped++;
    return true;
  }

  info(): string[] {
    return ['Kippt Müll gratis in die Umwelt', `Abgekippt: ${this.dumped}`];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#4a3b26';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.fillStyle = '#6b5a3e';
    ctx.beginPath();
    ctx.moveTo(-0.3, 0.3);
    ctx.lineTo(0, -0.28);
    ctx.lineTo(0.3, 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a7a56';
    ctx.fillRect(-0.12, 0.05, 0.1, 0.1);
    ctx.fillRect(0.08, 0.15, 0.08, 0.08);
  }
}

export const DUMP_DEF: BuildingDef = {
  id: 'factory:dump',
  name: 'Müllkippe',
  description: 'Kippt Müll gratis in die Umwelt. Verschmutzt (Atommüll strahlt).',
  size: { w: 1, h: 1 },
  cost: { stone: 5 },
  maxHp: 60,
  color: '#4a3b26',
  tags: ['pollutes'],
  rotatable: false,
  create: (init) => new Dump(init),
};

export class Disposal extends BaseBuilding {
  private disposed = 0;
  private lackedMoney = false;

  constructor(init: BuildingInit) {
    super(init);
  }

  acceptItem(item: ItemId, _from: Direction): boolean {
    const price = DISPOSAL_COST[item];
    if (price === undefined) return false;
    this.lackedMoney = !this.game.economy.spend(price, 'Müllentsorgung');
    if (this.lackedMoney) return false;
    this.disposed++;
    return true;
  }

  info(): string[] {
    const lines = ['Entsorgt Müll sauber', `Kosten: ${DISPOSAL_COST.waste} € pro Müll, ${DISPOSAL_COST.nuclear_waste} € pro Atommüll`, `Entsorgt: ${this.disposed}`];
    if (this.lackedMoney) lines.push('Nicht genug Geld – Müll staut sich zurück');
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#3d6b4f';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#1f3a2a';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    // Recycling-Pfeile als Kreis
    ctx.strokeStyle = '#cfeedd';
    ctx.lineWidth = 0.08;
    ctx.beginPath();
    ctx.arc(0, 0, 0.24, 0.3, Math.PI * 1.6);
    ctx.stroke();
    ctx.fillStyle = '#cfeedd';
    ctx.beginPath();
    ctx.moveTo(0.3, -0.12);
    ctx.lineTo(0.14, -0.2);
    ctx.lineTo(0.3, -0.3);
    ctx.closePath();
    ctx.fill();
  }
}

export const DISPOSAL_DEF: BuildingDef = {
  id: 'factory:disposal',
  name: 'Entsorgungsanlage',
  description: 'Entsorgt Müll sauber, aber gegen Geld (5 € pro Müll).',
  size: { w: 1, h: 1 },
  cost: { iron_plate: 10, gear: 5, concrete: 5 },
  requiresResearch: 'waste_management',
  maxHp: 120,
  color: '#3d6b4f',
  tags: ['waste_disposal'],
  rotatable: false,
  canPlace: needsConcreteResearch,
  create: (init) => new Disposal(init),
};
