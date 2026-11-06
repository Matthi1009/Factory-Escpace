// KI-Rechenzentrum: braucht sehr viel Strom und entzieht der Umgebung Wasser (env.water).
// Mit erforschter KI-Automatisierung machen laufende Rechenzentren alle Maschinen schneller.
import { BaseBuilding, TICKS_PER_SECOND, type BuildingDef, type BuildingInit } from '../../../core';
import { BALANCE } from '../balance';
import { aiFactor, datacenterSet } from '../state';

/** Wasser wird alle UPDATE Ticks in einem Schritt entzogen (spart Rechenzeit) */
const UPDATE = 10;

export class Datacenter extends BaseBuilding {
  /** Läuft es gerade (genug Strom)? Wird von aiFactor gelesen. */
  running = false;
  private lastPower = 0;

  constructor(init: BuildingInit) {
    super(init);
  }

  onPlace(): void {
    datacenterSet(this.game).add(this);
  }

  onRemove(): void {
    datacenterSet(this.game).delete(this);
    this.running = false;
  }

  tick(): void {
    const f = this.game.power.consume(BALANCE.datacenter.kw);
    this.lastPower = f;
    this.running = f >= BALANCE.datacenter.minSatisfaction;
    if (!this.running || this.game.tickCount % UPDATE !== 0) return;
    const c = this.center();
    const drain = (BALANCE.datacenter.waterPerSecond * UPDATE) / TICKS_PER_SECOND;
    this.game.world.forEachInRadius(c.x, c.y, BALANCE.datacenter.radius, (x, y) => this.game.env.add('water', x, y, -drain));
  }

  info(): string[] {
    const lines = [this.running ? 'Läuft' : 'Steht (zu wenig Strom)', `Strom: ${BALANCE.datacenter.kw} kW, Versorgung ${Math.round(this.lastPower * 100)} %`, `Entzieht Wasser im Umkreis von ${BALANCE.datacenter.radius} Kacheln`];
    if (this.game.research.isUnlocked('ai_automation')) lines.push(`KI-Bonus für alle Maschinen: +${Math.round((aiFactor(this.game) - 1) * 100)} %`);
    else lines.push('KI-Automatisierung noch nicht erforscht');
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#23303d';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#0e151c';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    // Server-Einschübe mit blinkenden Lampen
    for (let i = 0; i < 4; i++) {
      const y = -0.36 + i * 0.2;
      ctx.fillStyle = '#10171e';
      ctx.fillRect(-0.36, y, 0.72, 0.15);
      const on = this.running && Math.sin(time * (4 + i * 1.7) + i) > -0.2;
      ctx.fillStyle = on ? '#58e07a' : '#2c3b34';
      ctx.fillRect(0.2, y + 0.04, 0.07, 0.07);
      ctx.fillStyle = on ? '#7fd1ff' : '#2a3540';
      ctx.fillRect(0.08, y + 0.04, 0.07, 0.07);
    }
  }
}

export const DATACENTER_DEF: BuildingDef = {
  id: 'factory:datacenter',
  name: 'KI-Rechenzentrum',
  description: `Braucht ${BALANCE.datacenter.kw} kW und entzieht der Umgebung Wasser. Schaltet mit KI-Automatisierung Geschwindigkeitsbonus für alle Maschinen frei.`,
  size: { w: 1, h: 1 },
  cost: { iron_plate: 30, steel: 10, circuit: 20, concrete: 20 },
  requiresResearch: 'ai_datacenter',
  maxHp: 150,
  color: '#23303d',
  tags: ['datacenter', 'power_consumer'],
  rotatable: false,
  create: (init) => new Datacenter(init),
};
