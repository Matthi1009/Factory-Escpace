// Monster: Spawnen am Rand der verschmutzten Zone, Laufen über das Flow-Field zum Wrack, Gebäude angreifen.
// Monster sind keine Gebäude, sondern eigene Objekte; gezeichnet auf Ebene 'entities'.
import { createRng, TICKS_PER_SECOND, type Building, type Game } from '../../../core';
import { ENV_CONFIG } from '../config';
import { FlowField } from './flowField';
import { chooseMonsterType, MUTANT_BEETLE, type MonsterType } from './types';

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
export const STAT_KILLS = 'environment:kills';

export class MonsterManager {
  readonly monsters: Monster[] = [];
  readonly field: FlowField;
  private rng: () => number;
  private nextId = 1;
  private spawnBudget = 0;
  private lastSpawnTick = -Infinity;
  private seenTypes = new Set<string>([MUTANT_BEETLE.id]);
  private kills = 0;
  /** Wird aufgerufen, wenn ein Monster stirbt (z. B. für Effekte) */
  onDeath: ((m: Monster) => void) | null = null;

  constructor(private game: Game) {
    this.field = new FlowField(game);
    this.rng = createRng(game.seed ^ 0x5eed);
    game.stats.define({ id: STAT_MONSTERS, label: 'Monster', group: 'environment' });
    game.stats.set(STAT_MONSTERS, 0);
    game.stats.define({ id: STAT_KILLS, label: 'Besiegte Monster', group: 'environment' });
    game.stats.set(STAT_KILLS, 0);
    game.onTick(() => this.tick());
    game.renderer.addDrawHook('entities', (ctx, view) => this.draw(ctx, view.minX, view.minY, view.maxX, view.maxY, view.alpha, view.time, view.zoom));
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
    if (m.hp <= 0) return;
    m.hp -= amount;
    if (m.hp <= 0) {
      const i = this.monsters.indexOf(m);
      if (i >= 0) this.monsters.splice(i, 1);
      this.kills++;
      this.game.stats.set(STAT_KILLS, this.kills);
      this.onDeath?.(m);
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
      const type = this.typeAt(tile.x, tile.y);
      this.spawn(tile.x, tile.y, type);
      const now = this.game.tickCount;
      if (!this.seenTypes.has(type.id)) {
        this.seenTypes.add(type.id);
        this.game.notify(`Neue Mutation: ${type.name} – ${type.description}!`, 'warn');
      } else if (now - this.lastSpawnTick > C.waveNoticeGap * TICKS_PER_SECOND) {
        this.game.notify('Mutierte Tiere kriechen aus dem Smog auf die Basis zu!', 'warn');
      }
      this.lastSpawnTick = now;
    }
  }

  /** Mutation passend zur Umwelt an Kachel (x, y). */
  typeAt(x: number, y: number): MonsterType {
    return chooseMonsterType(this.game.env.get('temperature', x, y), this.game.env.get('radiation', x, y));
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

  private draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, maxX: number, maxY: number, alpha: number, time: number, zoom: number): void {
    for (const m of this.monsters) {
      const x = m.prevX + (m.x - m.prevX) * alpha;
      const y = m.prevY + (m.y - m.prevY) * alpha;
      if (x < minX - 1 || y < minY - 1 || x > maxX + 2 || y > maxY + 2) continue;
      const t = m.type;
      const r = t.size / 2;
      if (zoom < 14) {
        // weit herausgezoomt: nur ein Punkt (spart Zeichenzeit bei vielen Monstern)
        ctx.fillStyle = t.body;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        continue;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(m.angle);
      ctx.translate(m.lunge * 0.15, 0);
      const wiggle = Math.sin(time * 18 + m.id) * 0.08;
      switch (t.kind) {
        case 'ant':
          drawAnt(ctx, t, r, wiggle);
          break;
        case 'slug':
          drawSlug(ctx, t, r, time + m.id);
          break;
        case 'spider':
          drawSpider(ctx, t, r, wiggle);
          break;
        default:
          drawBeetle(ctx, t, r, wiggle);
      }
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

function legs(ctx: CanvasRenderingContext2D, r: number, wiggle: number, positions: number[], length: number): void {
  ctx.strokeStyle = '#1d0f26';
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  for (const s of [-1, 1]) {
    for (const k of positions) {
      ctx.moveTo(k * r, 0);
      ctx.lineTo(k * r + (k === 0 ? wiggle : -wiggle) * s, s * r * length);
    }
  }
  ctx.stroke();
}

function eyes(ctx: CanvasRenderingContext2D, x: number, r: number, color = '#ff3b30'): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, -r * 0.2, r * 0.14, r * 0.12);
  ctx.fillRect(x, r * 0.08, r * 0.14, r * 0.12);
}

function drawBeetle(ctx: CanvasRenderingContext2D, t: MonsterType, r: number, wiggle: number): void {
  legs(ctx, r, wiggle, [-0.6, 0, 0.6], 1.35);
  ctx.fillStyle = t.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.spots;
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.25, r * 0.16, 0, Math.PI * 2);
  ctx.arc(-r * 0.1, r * 0.3, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.2, -r * 0.05, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1636';
  ctx.beginPath();
  ctx.arc(r * 0.95, 0, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, r * 1.05, r);
}

function drawAnt(ctx: CanvasRenderingContext2D, t: MonsterType, r: number, wiggle: number): void {
  legs(ctx, r, wiggle * 1.5, [-0.3, 0.1, 0.5], 1.2);
  ctx.fillStyle = t.body;
  ctx.beginPath();
  ctx.ellipse(-r * 0.75, 0, r * 0.55, r * 0.42, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.1, 0, r * 0.32, r * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.75, 0, r * 0.36, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.spots;
  ctx.beginPath();
  ctx.arc(-r * 0.8, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.spots;
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.moveTo(r, -r * 0.1);
  ctx.lineTo(r * 1.5, -r * 0.5);
  ctx.moveTo(r, r * 0.1);
  ctx.lineTo(r * 1.5, r * 0.5);
  ctx.stroke();
  eyes(ctx, r * 0.9, r, '#ffe14d');
}

function drawSlug(ctx: CanvasRenderingContext2D, t: MonsterType, r: number, phase: number): void {
  // Leuchten
  ctx.fillStyle = 'rgba(182,255,61,0.18)';
  ctx.beginPath();
  ctx.arc(0, 0, r * (1.5 + 0.15 * Math.sin(phase * 3)), 0, Math.PI * 2);
  ctx.fill();
  const stretch = 1 + 0.1 * Math.sin(phase * 4);
  ctx.fillStyle = t.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * stretch, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.spots;
  ctx.beginPath();
  ctx.arc(-r * 0.4, -r * 0.1, r * 0.14, 0, Math.PI * 2);
  ctx.arc(r * 0.05, r * 0.15, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.4, -r * 0.15, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.body;
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  ctx.moveTo(r * 0.8, -r * 0.15);
  ctx.lineTo(r * 1.3, -r * 0.45);
  ctx.moveTo(r * 0.8, r * 0.15);
  ctx.lineTo(r * 1.3, r * 0.45);
  ctx.stroke();
  ctx.fillStyle = t.spots;
  ctx.fillRect(r * 1.25, -r * 0.52, r * 0.14, r * 0.14);
  ctx.fillRect(r * 1.25, r * 0.38, r * 0.14, r * 0.14);
}

function drawSpider(ctx: CanvasRenderingContext2D, t: MonsterType, r: number, wiggle: number): void {
  legs(ctx, r, wiggle, [-0.5, -0.15, 0.2, 0.55], 1.7);
  ctx.fillStyle = t.body;
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, 0, r * 0.65, r * 0.55, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.55, 0, r * 0.38, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.spots;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, 0);
  ctx.lineTo(-r * 0.35, -r * 0.3);
  ctx.lineTo(0, 0);
  ctx.lineTo(-r * 0.35, r * 0.3);
  ctx.closePath();
  ctx.fill();
  eyes(ctx, r * 0.75, r, '#7fd8ff');
}
