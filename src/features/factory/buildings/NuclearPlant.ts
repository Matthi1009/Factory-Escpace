// Atomkraftwerk: verbrennt Uran-Brennstäbe, liefert sehr viel Strom, erzeugt Atommüll.
// Der Atommüll geht seitlich/hinten aus dem Reaktor (Müllkippe = strahlt, Entsorgung = teuer).
// Ein voller Müllspeicher schaltet den Reaktor ab.
import { BaseBuilding, TICKS_PER_SECOND, type BuildingDef, type BuildingInit, type Direction, type ItemId } from '../../../core';
import { BALANCE } from '../balance';
import { flushWasteBox } from '../waste';
import type { Refuelable } from '../transfer';

const B = BALANCE.nuclearPlant;
const BURN_TICKS = B.burnSeconds * TICKS_PER_SECOND;

export class NuclearPlant extends BaseBuilding implements Refuelable {
  private fuel = 0;
  private burn = 0;
  private wasteBox: ItemId[] = [];
  private running = false;
  private warned = '';

  constructor(init: BuildingInit) {
    super(init);
  }

  acceptItem(item: ItemId, _from: Direction): boolean {
    if (item !== 'uranium_fuel' || this.fuel >= B.fuelCapacity) return false;
    this.fuel++;
    return true;
  }

  /** Brennstäbe aus dem Spieler-Inventar nachfüllen (Linksklick). */
  refuel(): number {
    const n = Math.min(B.fuelCapacity - this.fuel, this.game.inventory.count('uranium_fuel'));
    if (n > 0 && this.game.inventory.remove('uranium_fuel', n)) this.fuel += n;
    return n > 0 ? n : 0;
  }

  onRemove(): void {
    const inv = this.game.inventory;
    if (this.fuel > 0) inv.add('uranium_fuel', this.fuel);
    for (const w of this.wasteBox) inv.add(w, 1);
    this.fuel = 0;
    this.wasteBox = [];
  }

  tick(): void {
    flushWasteBox(this, this.wasteBox);
    this.running = false;
    // Läuft nur bei Strombedarf (wie das Kohlekraftwerk)
    if (this.game.power.demand <= 0) return;
    if (this.burn <= 0) {
      if (this.wasteBox.length >= B.wasteCapacity) return this.warn('waste', `Atomkraftwerk (${this.x}|${this.y}): Atommüll-Speicher voll, Reaktor abgeschaltet!`);
      if (this.fuel <= 0) return this.warn('fuel', `Atomkraftwerk (${this.x}|${this.y}) ohne Brennstäbe!`);
      this.fuel--;
      this.burn = BURN_TICKS;
    }
    this.warned = '';
    this.burn--;
    if (this.burn === 0) this.wasteBox.push('nuclear_waste');
    this.running = true;
    this.game.power.produce(B.kw);
    this.game.env.add('radiation', this.x, this.y, B.radiation / TICKS_PER_SECOND);
  }

  info(): string[] {
    const lines = [`Brennstäbe: ${this.fuel}/${B.fuelCapacity}`, this.running ? `Läuft: ${B.kw} kW` : 'Bereit (kein Strombedarf) oder gestoppt'];
    lines.push(`Atommüll: ${this.wasteBox.length}/${B.wasteCapacity}${this.wasteBox.length >= B.wasteCapacity ? ' – abführen!' : ''}`);
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#5c6068';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#2a2d33';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    // Reaktorkern
    const glow = this.running ? 0.65 + 0.3 * Math.sin(time * 5) : 0.18;
    ctx.fillStyle = `rgba(150,255,70,${glow})`;
    ctx.beginPath();
    ctx.arc(0, 0, 0.26, 0, Math.PI * 2);
    ctx.fill();
    // Strahlenzeichen
    ctx.fillStyle = '#1b1d20';
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3 + (this.running ? time * 1.5 : 0);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 0.2, a, a + Math.PI / 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#e7e125';
    ctx.fill();
  }

  private warn(kind: string, text: string): void {
    if (this.warned === kind) return;
    this.warned = kind;
    this.game.notify(text, 'warn');
  }
}

export const NUCLEAR_PLANT_DEF: BuildingDef = {
  id: 'factory:nuclear_plant',
  name: 'Atomkraftwerk',
  description: `Verbrennt Uran-Brennstäbe, liefert ${B.kw} kW und erzeugt Atommüll (seitlich/hinten abführen!).`,
  size: { w: 1, h: 1 },
  cost: { iron_plate: 20, steel: 20, circuit: 15, concrete: 30 },
  requiresResearch: 'nuclear',
  maxHp: 250,
  color: '#5c6068',
  tags: ['power_producer', 'reactor'],
  rotatable: true,
  create: (init) => new NuclearPlant(init),
};
