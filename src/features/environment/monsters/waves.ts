// Angriffswellen: Zusätzlich zum ständigen Nachschub kommt alle paar Minuten eine Welle aus einer Richtung –
// mit Vorwarnung (Meldung + roter Pfeil auf der Karte). Größe wächst mit Verschmutzung und Wellennummer.
import { createRng, TICKS_PER_SECOND, type Game } from '../../../core';
import { ENV_CONFIG } from '../config';
import type { MonsterManager } from './MonsterManager';

const C = ENV_CONFIG.waves;
const DIRECTIONS = ['Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten', 'Norden', 'Nordosten'];
export const STAT_WAVE = 'environment:wave';

export class WaveSystem {
  wave = 0;
  /** Sekunden bis zur nächsten Welle (zählt nur, solange die Verschmutzung über der Spawn-Schwelle liegt) */
  private nextIn = C.firstDelaySeconds;
  private pending: { angle: number; spawnTick: number; size: number } | null = null;
  private rng: () => number;

  constructor(private game: Game, private monsters: MonsterManager) {
    this.rng = createRng(game.seed ^ 0xa77ac);
    game.stats.define({ id: STAT_WAVE, label: 'Angriffswellen', group: 'environment' });
    game.stats.set(STAT_WAVE, 0);
    game.onTick((g) => {
      if (this.pending && g.tickCount >= this.pending.spawnTick) this.release();
      if (g.tickCount % TICKS_PER_SECOND === 30) this.second();
    });
    game.renderer.addDrawHook('ui-world', (ctx, view) => this.drawWarning(ctx, view.time, view.zoom));
  }

  /** Startet sofort eine Vorwarnung (auch für Tests). */
  announce(size?: number): void {
    if (this.pending) return;
    const total = this.game.env.total('pollution');
    const n =
      size ??
      Math.min(C.max, Math.round(C.base + Math.max(0, total - ENV_CONFIG.monsters.spawnThreshold) / C.perPollution + C.perWave * this.wave));
    const angle = this.rng() * Math.PI * 2;
    this.pending = { angle, spawnTick: this.game.tickCount + C.warningSeconds * TICKS_PER_SECOND, size: n };
    this.game.notify(`Angriffswelle in ${C.warningSeconds} s aus Richtung ${directionName(angle)}: etwa ${n} Monster!`, 'error');
  }

  private second(): void {
    if (this.game.over || this.pending) return;
    if (this.game.env.total('pollution') < ENV_CONFIG.monsters.spawnThreshold) return;
    if (--this.nextIn > 0) return;
    this.nextIn = C.intervalSeconds;
    this.announce();
  }

  private release(): void {
    const p = this.pending!;
    this.pending = null;
    this.wave++;
    this.game.stats.set(STAT_WAVE, this.wave);
    const c = this.game.wreck?.center() ?? this.game.world.spawn;
    let spawned = 0;
    for (let tries = 0; tries < p.size * 20 && spawned < p.size; tries++) {
      const a = p.angle + (this.rng() - 0.5) * 0.5;
      const d = C.distance + (this.rng() - 0.5) * 8;
      const x = Math.floor(c.x + Math.cos(a) * d);
      const y = Math.floor(c.y + Math.sin(a) * d);
      const w = this.game.world;
      if (!w.inBounds(x, y) || w.getTerrain(x, y) === 'water' || w.getBuilding(x, y)) continue;
      if (!Number.isFinite(this.monsters.field.get(x, y))) continue;
      this.monsters.spawn(x, y, this.monsters.typeAt(x, y));
      spawned++;
    }
    this.game.notify(`Welle ${this.wave}: ${spawned} Monster greifen an!`, 'warn');
  }

  private drawWarning(ctx: CanvasRenderingContext2D, time: number, zoom: number): void {
    const p = this.pending;
    if (!p) return;
    const c = this.game.wreck?.center() ?? this.game.world.spawn;
    const blink = 0.5 + 0.5 * Math.sin(time * 8);
    const tip = { x: c.x + Math.cos(p.angle) * (C.distance - 10), y: c.y + Math.sin(p.angle) * (C.distance - 10) };
    const tail = { x: c.x + Math.cos(p.angle) * C.distance, y: c.y + Math.sin(p.angle) * C.distance };
    ctx.strokeStyle = `rgba(255,60,40,${0.5 + 0.5 * blink})`;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = Math.max(0.3, 4 / zoom);
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    const back = p.angle + Math.PI;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x + Math.cos(back + 0.4) * 2.5, tip.y + Math.sin(back + 0.4) * 2.5);
    ctx.lineTo(tip.x + Math.cos(back - 0.4) * 2.5, tip.y + Math.sin(back - 0.4) * 2.5);
    ctx.closePath();
    ctx.fill();
  }
}

/** Himmelsrichtung eines Winkels (x nach rechts, y nach unten). */
function directionName(angle: number): string {
  const k = Math.round(((angle % (Math.PI * 2)) + Math.PI * 2) / (Math.PI / 4)) % 8;
  return DIRECTIONS[k]!;
}
