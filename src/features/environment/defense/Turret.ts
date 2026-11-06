// Geschützturm: schießt auf das nächste Monster in Reichweite.
// Mit Stromnetz (Kraftwerk vorhanden) läuft er über Strom, sonst über Munition:
// Eisenplatten (10 Schuss) oder Stahl (25 Schuss) per Band/Greifarm hineinschieben. Startmunition: 30 Schuss.
import { BaseBuilding, TICKS_PER_SECOND, type BuildingDef, type BuildingInit, type Direction, type ItemId } from '../../../core';
import { ENV_CONFIG } from '../config';
import type { Effects } from '../effects';
import type { Monster, MonsterManager } from '../monsters/MonsterManager';

const C = ENV_CONFIG.defense.turret;
export const TURRET_ID = 'environment:turret';

export class Turret extends BaseBuilding {
  ammo: number = C.startAmmo;
  private cooldown = 0;
  private angle = -Math.PI / 2;
  private muzzle = 0;
  private powered = false;
  private warnedEmpty = false;

  constructor(
    init: BuildingInit,
    private monsters: MonsterManager,
    private effects: Effects,
  ) {
    super(init);
  }

  /** Munition annehmen (vom Band oder Greifarm). */
  acceptItem(item: ItemId, _from: Direction): boolean {
    const shots = C.ammoPerItem[item];
    if (!shots || this.ammo + shots > C.maxAmmo) return false;
    this.ammo += shots;
    this.warnedEmpty = false;
    return true;
  }

  tick(): void {
    if (this.cooldown > 0) this.cooldown--;
    if (this.muzzle > 0) this.muzzle = Math.max(0, this.muzzle - 0.2);
    const target = this.findTarget();
    const power = this.game.power;
    // Strom nur nutzen, wenn es überhaupt ein Netz gibt – sonst würde der Bedarf alle anderen ausbremsen
    const grid = power.production > 0;
    const supply = grid ? power.consume(target ? C.kw : C.idleKw) : 0;
    this.powered = supply >= 0.5;
    if (!target) return;
    const c = this.center();
    this.angle = Math.atan2(target.y - c.y, target.x - c.x);
    if (this.cooldown > 0) return;
    if (!this.powered) {
      if (this.ammo <= 0) {
        if (!this.warnedEmpty) {
          this.warnedEmpty = true;
          this.game.notify('Ein Geschützturm hat weder Strom noch Munition (Eisen-/Stahlplatten hineinschieben)!', 'warn');
        }
        return;
      }
      this.ammo--;
    }
    this.cooldown = C.cooldownTicks;
    this.muzzle = 1;
    const mx = c.x + Math.cos(this.angle) * 0.45;
    const my = c.y + Math.sin(this.angle) * 0.45;
    this.effects.tracer(mx, my, target.x, target.y, this.powered ? '#8fe3ff' : '#ffe28a');
    this.monsters.damage(target, C.damage);
  }

  private findTarget(): Monster | null {
    const c = this.center();
    let best: Monster | null = null;
    let bestD = C.range * C.range;
    for (const m of this.monsters.monsters) {
      const dx = m.x - c.x;
      const dy = m.y - c.y;
      const d = dx * dx + dy * dy;
      if (d <= bestD) {
        bestD = d;
        best = m;
      }
    }
    return best;
  }

  info(): string[] {
    return [
      `Reichweite: ${C.range} Kacheln · ${(C.damage * TICKS_PER_SECOND) / C.cooldownTicks} Schaden/s`,
      this.powered ? 'Versorgung: Strom' : `Munition: ${this.ammo} Schuss`,
    ];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Sockel
    ctx.fillStyle = '#3d4450';
    ctx.fillRect(-0.42, -0.42, 0.84, 0.84);
    ctx.fillStyle = '#596273';
    ctx.beginPath();
    ctx.arc(0, 0, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Lauf zeigt zum Ziel (Gebäude ist nicht drehbar, ctx ist also nicht gedreht)
    ctx.save();
    ctx.rotate(this.angle);
    ctx.fillStyle = '#2a2f38';
    ctx.fillRect(0, -0.07, 0.48, 0.14);
    if (this.muzzle > 0) {
      ctx.fillStyle = `rgba(255,220,120,${this.muzzle})`;
      ctx.beginPath();
      ctx.arc(0.52, 0, 0.12 * this.muzzle + 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Statuslicht: blau = Strom, gelb = Munition, rot = leer
    ctx.fillStyle = this.powered ? '#4fc3ff' : this.ammo > 0 ? '#ffcc33' : '#ff3b30';
    ctx.beginPath();
    ctx.arc(-0.28, -0.28, 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createTurretDef(monsters: MonsterManager, effects: Effects): BuildingDef {
  return {
    id: TURRET_ID,
    name: 'Geschützturm',
    description: `Schießt auf Monster (Reichweite ${C.range}). Strom oder Munition (Eisen-/Stahlplatten).`,
    size: { w: 1, h: 1 },
    cost: C.cost,
    maxHp: C.maxHp,
    color: '#3d4450',
    tags: ['defense', 'power_consumer'],
    requiresResearch: 'turrets',
    rotatable: false,
    create: (init) => new Turret(init, monsters, effects),
  };
}
