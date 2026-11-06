// Kernschmelze-Finale (Satire): Atomreaktoren (Tag 'reactor') bauen Risiko auf, wenn es am Reaktor zu heiß
// oder zu trocken ist (kein Kühlwasser) – oder wenn man die Sicherheitssysteme abschaltet, um Geld zu sparen.
// Bei 100 % schmilzt der Reaktor: Strahlung, Verschmutzung, verseuchtes Land, danach Spielende.
import { TICKS_PER_SECOND, type Building, type Game } from '../../core';
import { PROGRESSION_CONFIG } from './config';
import { formatMoney } from './research';

const C = PROGRESSION_CONFIG.meltdown;
export const STAT_MELTDOWN = 'progression:meltdown_risk';

export class Meltdown {
  /** Risiko je Reaktor in % (0..100) */
  readonly risk = new Map<Building, number>();
  safetyOff = false;
  /** Ort und Zeitpunkt der Explosion (für Effekte und das verzögerte Spielende) */
  explosion: { x: number; y: number; tick: number } | null = null;
  private warned = new Map<Building, number>();

  constructor(private game: Game) {
    game.stats.define({ id: STAT_MELTDOWN, label: 'Kernschmelze-Risiko', unit: '%', group: 'Ziel' });
    game.stats.set(STAT_MELTDOWN, 0);

    game.registries.actions.register({
      id: 'progression:safety_off',
      name: 'Sicherheitssysteme abschalten',
      description: `Spart Wartungskosten: +${formatMoney(C.safetyOffBonus)} sofort. Was soll schon passieren?`,
      category: 'Wirtschaft',
      run: () => this.setSafety(false),
      isAvailable: (g) => !this.safetyOff && !g.over && g.world.buildingsWithTag('reactor').length > 0,
    });
    game.registries.actions.register({
      id: 'progression:safety_on',
      name: 'Sicherheitssysteme wieder einschalten',
      description: `Kostet ${formatMoney(C.safetyOffBonus * 2)} – Sicherheit war schon immer teurer als Leichtsinn.`,
      category: 'Wirtschaft',
      run: () => this.setSafety(true),
      isAvailable: (g) => this.safetyOff && !g.over && g.economy.canAfford(C.safetyOffBonus * 2),
    });

    game.events.on('buildingRemoved', ({ building }) => this.forget(building));
    game.events.on('buildingDestroyed', ({ building }) => this.forget(building));
    game.onTick((g) => this.tick(g));
    game.renderer.addDrawHook('effects', (ctx, view) => this.draw(ctx, view.time));
  }

  setSafety(on: boolean): void {
    const g = this.game;
    if (on === !this.safetyOff) return;
    if (on) {
      if (!g.economy.spend(C.safetyOffBonus * 2, 'Sicherheitssysteme')) {
        g.notify('Zu wenig Geld, um die Sicherheitssysteme wieder einzuschalten.', 'warn');
        return;
      }
      this.safetyOff = false;
      g.notify('Sicherheitssysteme laufen wieder. Die Versicherung atmet auf.', 'success');
    } else {
      this.safetyOff = true;
      g.economy.add(C.safetyOffBonus, 'Wartung gespart');
      g.notify(`Sicherheitssysteme abgeschaltet: +${formatMoney(C.safetyOffBonus)}. Der Reaktor wird langsam warm …`, 'warn');
    }
  }

  /** Lässt einen Reaktor sofort schmelzen (auch für Tests). */
  explode(b: Building): void {
    if (this.explosion || b.removed) return;
    const g = this.game;
    const c = b.center();
    g.destroyBuilding(b);
    g.world.forEachInRadius(c.x, c.y, C.radius, (x, y, d) => {
      const f = 1 - d / C.radius;
      g.env.add('radiation', x, y, C.radiation * f);
      g.env.add('pollution', x, y, C.pollution * f);
      if (d <= C.toxicRadius && g.world.getTerrain(x, y) !== 'water') g.world.setTerrain(x, y, 'toxic');
    });
    const r = Math.ceil(C.toxicRadius);
    g.renderer.invalidateGround(Math.floor(c.x) - r, Math.floor(c.y) - r, 2 * r + 1, 2 * r + 1);
    this.explosion = { x: c.x, y: c.y, tick: g.tickCount };
    g.notify('KERNSCHMELZE! Die Region ist für die nächsten 24.000 Jahre unbewohnbar.', 'error');
  }

  private tick(g: Game): void {
    if (this.explosion) {
      if (g.tickCount - this.explosion.tick >= C.endDelaySeconds * TICKS_PER_SECOND) {
        g.endGame(false, 'Kernschmelze. Die Region ist unbewohnbar – aber immerhin war der Strom eine Zeit lang billig.');
      }
      return;
    }
    if (g.tickCount % TICKS_PER_SECOND !== 0) return;
    let max = 0;
    for (const b of g.world.buildingsWithTag('reactor')) {
      const hot = g.env.get('temperature', b.x, b.y) > C.hotTemperature || g.env.get('water', b.x, b.y) < C.lowWater;
      const delta = this.safetyOff ? C.riskPerSecondNoSafety : hot ? C.riskPerSecondHot : -C.riskCoolPerSecond;
      const r = Math.min(100, Math.max(0, (this.risk.get(b) ?? 0) + delta));
      this.risk.set(b, r);
      this.warn(b, r, hot);
      if (r >= 100) {
        this.explode(b);
        return;
      }
      max = Math.max(max, r);
    }
    g.stats.set(STAT_MELTDOWN, Math.round(max));
  }

  private warn(b: Building, r: number, hot: boolean): void {
    const level = r >= 80 ? 80 : r >= 50 ? 50 : 0;
    const last = this.warned.get(b) ?? 0;
    if (level > last) {
      const why = this.safetyOff ? 'Sicherheitssysteme aus' : hot ? 'zu heiß / kein Kühlwasser' : '';
      this.game.notify(`${b.def.name}: Kernschmelze-Risiko ${level} % (${why})!`, level >= 80 ? 'error' : 'warn');
    }
    this.warned.set(b, level);
  }

  private forget(b: Building): void {
    this.risk.delete(b);
    this.warned.delete(b);
  }

  private draw(ctx: CanvasRenderingContext2D, time: number): void {
    const e = this.explosion;
    if (!e) return;
    const t = time - e.tick / TICKS_PER_SECOND;
    if (t < 0) return;
    // Lichtblitz
    if (t < 1.2) {
      ctx.fillStyle = `rgba(255,255,230,${0.85 * (1 - t / 1.2)})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 6 + t * 30, 0, Math.PI * 2);
      ctx.fill();
    }
    // Druckwelle
    ctx.strokeStyle = `rgba(255,170,60,${Math.max(0, 0.8 - t * 0.15)})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(e.x, e.y, t * C.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    // Pilzwolke
    const h = Math.min(6, t * 2);
    ctx.fillStyle = 'rgba(90,70,50,0.75)';
    ctx.fillRect(e.x - 0.6, e.y - h, 1.2, h);
    ctx.fillStyle = 'rgba(120,95,70,0.85)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - h, 1.5 + h * 0.4, 0.8 + h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,140,40,0.5)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - h + 0.2, 1 + h * 0.25, 0.5 + h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
