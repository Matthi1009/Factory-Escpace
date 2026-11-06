// Kraftfeld: Monster kommen nicht in die Kuppel (sie werden am Rand zurückgestoßen und gegrillt),
// Gebäude darin können nicht angegriffen werden. Braucht viel Strom – und heizt die Region kräftig auf
// (Satire: Sicherheit für die Basis, Hitzewelle für die Umgebung, ggf. Kernschmelze-Risiko am Reaktor).
import { BaseBuilding, TICKS_PER_SECOND, type Building, type BuildingDef, type BuildingInit, type Game } from '../../../core';
import type { Climate } from '../climate';
import { ENV_CONFIG } from '../config';
import type { Effects } from '../effects';
import type { MonsterManager } from '../monsters/MonsterManager';

const C = ENV_CONFIG.defense.forceField;
export const FORCE_FIELD_ID = 'environment:force_field';

export class ForceField extends BaseBuilding {
  /** Kuppel aktiv (genug Strom) */
  on = false;

  constructor(init: BuildingInit) {
    super(init);
  }

  tick(): void {
    const power = this.game.power;
    this.on = power.production > 0 && power.consume(C.kw) >= 0.5;
  }

  /** Liegt der Punkt in der aktiven Kuppel? */
  covers(x: number, y: number, margin = 0): boolean {
    if (!this.on || !this.game.isActive(this)) return false;
    const c = this.center();
    return Math.hypot(x - c.x, y - c.y) <= C.radius + margin;
  }

  info(): string[] {
    return [this.on ? `Kuppel aktiv (Radius ${C.radius})` : `Aus – braucht ${C.kw} kW Strom`, 'Heizt die Umgebung stark auf'];
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#2b3a55';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.fillStyle = '#44597d';
    ctx.beginPath();
    ctx.moveTo(0, -0.38);
    ctx.lineTo(0.38, 0);
    ctx.lineTo(0, 0.38);
    ctx.lineTo(-0.38, 0);
    ctx.closePath();
    ctx.fill();
    const glow = this.on ? 0.6 + 0.4 * Math.sin(time * 5) : 0.15;
    ctx.fillStyle = `rgba(110,200,255,${glow})`;
    ctx.beginPath();
    ctx.arc(0, 0, 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Verwaltet alle Kraftfelder: Monster abwehren, Gebäude schützen, Hitze erzeugen, Kuppel zeichnen. */
export class ForceFieldSystem {
  constructor(
    private game: Game,
    monsters: MonsterManager,
    climate: Climate,
    private effects: Effects,
  ) {
    game.registries.buildings.register(this.def());
    monsters.isProtected = (b: Building) => this.fields().some((f) => f !== b && f.covers(b.center().x, b.center().y));

    // Nach der Monster-Bewegung: alles in der Kuppel an den Rand schieben und Schaden machen
    game.onTick(() => {
      const fields = this.fields().filter((f) => f.on && game.isActive(f));
      if (!fields.length) return;
      for (const m of [...monsters.monsters]) {
        for (const f of fields) {
          const c = f.center();
          const dx = m.x - c.x;
          const dy = m.y - c.y;
          const d = Math.hypot(dx, dy) || 0.001;
          if (d > C.radius) continue;
          const edge = C.radius + 0.05;
          m.x = c.x + (dx / d) * edge;
          m.y = c.y + (dy / d) * edge;
          monsters.damage(m, C.zapDps / TICKS_PER_SECOND);
          if (game.tickCount % 20 === m.id % 20) this.effects.tracer(m.x, m.y, m.x - (dx / d) * 0.6, m.y - (dy / d) * 0.6, '#8fe3ff');
          break;
        }
      }
    });

    // Hitze in die Klimasimulation eintragen
    climate.onBeforeStep.push(() => {
      for (const f of this.fields()) {
        if (!f.on) continue;
        const c = f.center();
        const range = C.radius * C.heatRange;
        game.world.forEachInRadius(c.x, c.y, range, (x, y, d) => {
          climate.heatSources[game.world.index(x, y)]! += C.heat * (1 - d / range);
        });
      }
    });

    // Kuppel
    game.renderer.addDrawHook('effects', (ctx, view) => {
      for (const f of this.fields()) {
        if (!f.on) continue;
        const c = f.center();
        if (c.x + C.radius < view.minX || c.x - C.radius > view.maxX + 1 || c.y + C.radius < view.minY || c.y - C.radius > view.maxY + 1) continue;
        const shimmer = 0.5 + 0.5 * Math.sin(view.time * 2 + f.uid);
        ctx.fillStyle = `rgba(110,200,255,${0.06 + 0.03 * shimmer})`;
        ctx.strokeStyle = `rgba(140,215,255,${0.5 + 0.3 * shimmer})`;
        ctx.lineWidth = 3 / view.zoom;
        ctx.beginPath();
        ctx.arc(c.x, c.y, C.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  private fields(): ForceField[] {
    return this.game.world.buildingsOfType(FORCE_FIELD_ID) as ForceField[];
  }

  private def(): BuildingDef {
    return {
      id: FORCE_FIELD_ID,
      name: 'Kraftfeld',
      description: `Kuppel (Radius ${C.radius}) hält Monster fern. Braucht ${C.kw} kW – und heizt die Region auf.`,
      size: { w: 1, h: 1 },
      cost: C.cost,
      maxHp: C.maxHp,
      color: '#2b3a55',
      tags: ['defense', 'power_consumer'],
      requiresResearch: 'force_field',
      rotatable: false,
      create: (init) => new ForceField(init),
    };
  }
}
