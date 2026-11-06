// Kohlekraftwerk: verbrennt Kohle und liefert Strom, solange es gebraucht wird. Verschmutzt stark.
// Kohle kommt per Band/Greifarm oder per Linksklick aus dem Inventar.
import { BaseBuilding, TICKS_PER_SECOND, type BuildingDef, type BuildingInit, type Direction, type ItemId } from '../../../core';
import type { Refuelable } from '../transfer';
import { BALANCE } from '../balance';

/** Leistung in kW */
export const PLANT_KW = BALANCE.coalPlant.kw;
/** 1 Kohle läuft 20 s */
const BURN_TICKS = BALANCE.coalPlant.burnSeconds * TICKS_PER_SECOND;
const MAX_COAL = BALANCE.coalPlant.coalCapacity;
const POLLUTION_PER_SECOND = BALANCE.coalPlant.pollution;

export class CoalPlant extends BaseBuilding implements Refuelable {
  private coal = 0;
  private burn = 0;
  private running = false;
  private warned = false;

  constructor(init: BuildingInit) {
    super(init);
  }

  acceptItem(item: ItemId, _from: Direction): boolean {
    if (item !== 'coal' || this.coal >= MAX_COAL) return false;
    this.coal++;
    return true;
  }

  refuel(): number {
    const n = Math.min(MAX_COAL - this.coal, this.game.inventory.count('coal'));
    if (n > 0 && this.game.inventory.remove('coal', n)) this.coal += n;
    return n > 0 ? n : 0;
  }

  onRemove(): void {
    if (this.coal > 0) this.game.inventory.add('coal', this.coal);
    this.coal = 0;
  }

  tick(): void {
    // Läuft nur, wenn im letzten Tick Strom gebraucht wurde (kein sinnloses Verbrennen)
    const needed = this.game.power.demand > 0;
    this.running = false;
    if (!needed) {
      this.warned = false;
      return;
    }
    if (this.burn <= 0) {
      if (this.coal <= 0) {
        if (!this.warned) {
          this.warned = true;
          this.game.notify(`Kohlekraftwerk (${this.x}|${this.y}) ohne Kohle!`, 'warn');
        }
        return;
      }
      this.coal--;
      this.burn = BURN_TICKS;
    }
    this.burn--;
    this.running = true;
    this.warned = false;
    this.game.power.produce(PLANT_KW);
    this.game.env.add('pollution', this.x, this.y, POLLUTION_PER_SECOND / TICKS_PER_SECOND);
  }

  info(): string[] {
    const lines = [`Kohle: ${this.coal}/${MAX_COAL}`];
    lines.push(this.running ? `Läuft: ${PLANT_KW} kW` : this.coal <= 0 && this.burn <= 0 ? 'Ohne Kohle' : 'Bereit (kein Strombedarf)');
    lines.push(`Netz: ${Math.round(this.game.power.satisfaction * 100)} % versorgt`);
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#4b4b50';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    // Schornstein und Glut
    ctx.fillStyle = '#2d2d31';
    ctx.fillRect(-0.12, -0.38, 0.24, 0.5);
    ctx.fillStyle = this.running ? `rgba(255,${120 + 40 * Math.sin(time * 9)},30,0.9)` : 'rgba(120,60,20,0.4)';
    ctx.fillRect(-0.3, 0.14, 0.6, 0.22);
    if (this.running) {
      ctx.fillStyle = 'rgba(160,160,160,0.45)';
      const r = 0.08 + 0.06 * ((time * 1.5) % 1);
      ctx.beginPath();
      ctx.arc(0, -0.42 - ((time * 1.5) % 1) * 0.25, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Blitz-Symbol: Stromerzeuger
    ctx.fillStyle = '#ffd84a';
    ctx.beginPath();
    ctx.moveTo(0.34, -0.38);
    ctx.lineTo(0.2, -0.16);
    ctx.lineTo(0.3, -0.16);
    ctx.lineTo(0.22, 0.04);
    ctx.lineTo(0.42, -0.2);
    ctx.lineTo(0.32, -0.2);
    ctx.closePath();
    ctx.fill();
  }
}

export const COAL_PLANT_DEF: BuildingDef = {
  id: 'factory:coal_plant',
  name: 'Kohlekraftwerk',
  description: `Verbrennt Kohle und liefert ${PLANT_KW} kW. Kohle per Band/Greifarm oder Linksklick. Verschmutzt stark.`,
  size: { w: 1, h: 1 },
  cost: { iron_plate: 10, gear: 5, stone: 5 },
  requiresResearch: 'power_coal',
  maxHp: 150,
  color: '#4b4b50',
  tags: ['power_producer', 'pollutes'],
  rotatable: false,
  create: (init) => new CoalPlant(init),
};
