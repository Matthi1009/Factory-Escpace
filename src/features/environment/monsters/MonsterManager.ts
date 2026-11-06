// Monster: Spawnen am Rand der verschmutzten Zone, Laufen über das Flow-Field zum Wrack, Gebäude angreifen.
// Monster sind keine Gebäude, sondern eigene Objekte; gezeichnet auf Ebene 'entities'.
import { createRng, TICKS_PER_SECOND, type Building, type Game } from '../../../core';
import { ENV_CONFIG } from '../config';
import { FlowField } from './flowField';
import { MUTANT_BEETLE, type MonsterType } from './types';

const C = ENV_CONFIG.monsters;

export interface Monster {
  readonly id: number;
  type: MonsterType;
  /** Position (Mittelpunkt) in Weltkoordinaten */
  x: number;
  y: number;
  /** Position im letzten Tick (für weiche Bewegung) */
  prevX: number;
  prevY: number;
  hp: number;
  /** Blickrichtung in Radiant */
  angle: number;
  cooldown: number;
  /** 0..1, kurzer Ausfallschritt beim Biss */
  lunge: number;
  /** kleine Verschiebung, damit Monster nicht exakt übereinander laufen */
  offX: number;
  offY: number;
}

export const STAT_MONSTERS = 'environment:monsters';

export class MonsterManager {
  readonly monsters: Monster[] = [];
  readonly field: FlowField;
  private rng: () => number;
  private nextId = 1;
  private spawnBudget = 0;
  private lastSpawnTick = -Infinity;

  constructor(private game: Game) {
    this.field = new FlowField(game);
    this.rng = createRng(game.seed ^ 0x5eed);
    game.stats.define({ id: STAT_MONSTERS, label: 'Monster', group: 'environment' });
    game.stats.set(STAT_MONSTERS, 0);
    game.onTick(() => this.tick());
    game.renderer.addDrawHook('entities', (ctx, view) => this.draw(ctx, view.minX, view.minY, view.maxX, view.maxY, view.alpha, view.time));
  }

  /** Erzeugt ein Monster auf Kachel (x, y). Auch für Tests/Konsole: game-Zugriff über window.game ist nicht nötig. */
  spawn(x: number, y: number, type: MonsterType = MUTANT_BEETLE): Monster {
    const m: Monster = {
      id: this.nextId++,
      type,
      x: x + 0.5,
      y: y + 0.5,
      prevX: x + 0.5,
      prevY: y + 0.5,
      hp: type.maxHp,
      angle: 0,
      cooldown: 0,
      lunge: 0,
      offX: (this.rng() - 0.5) * 0.4,
      offY: (this.rng() - 0.5) * 0.4,
    };
    this.monsters.push(m);
    return m;
  }

  /** Schaden an einem Monster (für Geschütztürme in M2). Bei hp ≤ 0 wird es entfernt. */
  damage(m: Monster, amount: number): void {
    m.hp -= amount;
    if (m.hp <= 0) {
      const i = this.monsters.indexOf(m);
      if (i >= 0) this.monsters.splice(i, 1);
    }
  }

  private tick(): void {
    if (this.game.over) return;
    this.field.update();
    this.spawnTick();
    for (const m of this.monsters) this.updateMonster(m);
    if (this.game.tickCount % TICKS_PER_SECOND === 0) this.game.stats.set(STAT_MONSTERS, this.monsters.length);
  }

  // ---------- Spawnen ----------

  private spawnTick(): void {
    if (this.game.tickCount % TICKS_PER_SECOND !== 0) return; // einmal pro Sekunde
    const total = this.game.env.total('pollution');
    if (total < C.spawnThreshold || this.monsters.length >= C.maxAlive) {
      this.spawnBudget = 0;
      return;
    }
    this.spawnBudget += ((total - C.spawnThreshold) * C.spawnPerMinutePerPollution) / 60;
    while (this.spawnBudget >= 1 && this.monsters.length < C.maxAlive) {
      this.spawnBudget -= 1;
      const tile = this.findSpawnTile();
      if (!tile) break;
      this.spawn(tile.x, tile.y);
      const now = this.game.tickCount;
      if (now - this.lastSpawnTick > C.waveNoticeGap * TICKS_PER_SECOND) {
        this.game.notify('Mutierte Käfer kriechen aus dem Smog auf die Basis zu!', 'warn');
      }
      this.lastSpawnTick = now;
    }
  }

  /** Zufällige Kachel am Rand der verschmutzten Zone, weit genug von Wrack und Gebäuden, mit Weg zum Wrack. */
  private findSpawnTile(): { x: number; y: number } | null {
    const { world, env, wreck } = this.game;
    const wc = wreck?.center() ?? world.spawn;
    for (let tries = 0; tries < 400; tries++) {
      const x = Math.floor(this.rng() * world.width);
      const y = Math.floor(this.rng() * world.height);
      const p = env.get('pollution', x, y);
      if (p < C.edgeMin || p > C.edgeMax) continue;
      if (Math.hypot(x + 0.5 - wc.x, y + 0.5 - wc.y) < C.minDistWreck) continue;
      if (!Number.isFinite(this.field.get(x, y)) || world.getBuilding(x, y)) continue;
      if (world.buildingsInRadius(x + 0.5, y + 0.5, C.minDistBuilding).length > 0) continue;
      return { x, y };
    }
    return null;
  }

  // ---------- Bewegung & Angriff ----------

  private updateMonster(m: Monster): void {
    const { world } = this.game;
    m.prevX = m.x;
    m.prevY = m.y;
    if (m.cooldown > 0) m.cooldown--;
    if (m.lunge > 0) m.lunge = Math.max(0, m.lunge - 0.08);

    const tx = Math.floor(m.x);
    const ty = Math.floor(m.y);
    // Auf der eigenen Kachel wurde gebaut → dieses Gebäude angreifen
    const here = world.getBuilding(tx, ty);
    if (here) {
      this.attack(m, here, tx + 0.5, ty + 0.5);
      return;
    }
    const next = this.nextTile(tx, ty);
    if (!next) return; // kein Weg (z. B. Insel) → stehen bleiben

    const b = world.getBuilding(next.x, next.y);
    const cx = next.x + 0.5;
    const cy = next.y + 0.5;
    if (b) {
      // Gebäude im Weg (oder das Wrack): an die Kante laufen, dann beißen
      const d = Math.hypot(cx - m.x, cy - m.y);
      if (d <= 0.85) {
        this.attack(m, b, cx, cy);
        return;
      }
      this.moveToward(m, cx, cy);
      return;
    }
    this.moveToward(m, cx + m.offX, cy + m.offY);
  }

  /** Nachbarkachel (4er-Nachbarschaft) mit den geringsten Wegkosten. */
  private nextTile(x: number, y: number): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestD = this.field.get(x, y);
    for (const n of this.game.world.neighbors4(x, y)) {
      const d = this.field.get(n.x, n.y);
      if (d < bestD) {
        bestD = d;
        best = { x: n.x, y: n.y };
      }
    }
    return best;
  }

  private moveToward(m: Monster, x: number, y: number): void {
    const dx = x - m.x;
    const dy = y - m.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return;
    const step = Math.min(d, m.type.speed / TICKS_PER_SECOND);
    m.x += (dx / d) * step;
    m.y += (dy / d) * step;
    m.angle = Math.atan2(dy, dx);
  }

  private attack(m: Monster, b: Building, cx: number, cy: number): void {
    m.angle = Math.atan2(cy - m.y, cx - m.x);
    if (m.cooldown > 0) return;
    m.cooldown = m.type.attackTicks;
    m.lunge = 1;
    this.game.damageBuilding(b, m.type.damage);
  }

  // ---------- Zeichnen ----------

  private draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, maxX: number, maxY: number, alpha: number, time: number): void {
    for (const m of this.monsters) {
      const x = m.prevX + (m.x - m.prevX) * alpha;
      const y = m.prevY + (m.y - m.prevY) * alpha;
      if (x < minX - 1 || y < minY - 1 || x > maxX + 2 || y > maxY + 2) continue;
      const t = m.type;
      const r = t.size / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(m.angle);
      ctx.translate(m.lunge * 0.15, 0);
      // Beine (zappeln beim Laufen)
      const wiggle = Math.sin(time * 18 + m.id) * 0.08;
      ctx.strokeStyle = '#1d0f26';
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      for (const s of [-1, 1]) {
        for (const k of [-0.6, 0, 0.6]) {
          ctx.moveTo(k * r, 0);
          ctx.lineTo(k * r + (k === 0 ? wiggle : -wiggle) * s, s * r * 1.35);
        }
      }
      ctx.stroke();
      // Körper
      ctx.fillStyle = t.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      // giftige Flecken
      ctx.fillStyle = t.spots;
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.25, r * 0.16, 0, Math.PI * 2);
      ctx.arc(-r * 0.1, r * 0.3, r * 0.12, 0, Math.PI * 2);
      ctx.arc(r * 0.2, -r * 0.05, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Kopf mit leuchtenden Augen
      ctx.fillStyle = '#2a1636';
      ctx.beginPath();
      ctx.arc(r * 0.95, 0, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(r * 1.05, -r * 0.2, r * 0.14, r * 0.12);
      ctx.fillRect(r * 1.05, r * 0.08, r * 0.14, r * 0.12);
      ctx.restore();
      if (m.hp < t.maxHp) {
        const f = Math.max(0, m.hp / t.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x - 0.3, y - r - 0.2, 0.6, 0.08);
        ctx.fillStyle = '#ff3b30';
        ctx.fillRect(x - 0.3, y - r - 0.2, 0.6 * f, 0.08);
      }
    }
  }
}
