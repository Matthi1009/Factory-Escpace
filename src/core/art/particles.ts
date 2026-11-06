// Einfaches Partikelsystem für Dampf, Rauch, Funken und Strahlungsglimmen – mit fester Obergrenze (Pool).
// Emittiert wird nur, was gerade gezeichnet wird (die Emitter sitzen in draw() sichtbarer Gebäude) und nur ab LOD 1.
import type { Game } from '../Game';
import type { View } from '../render/Renderer';

export type ParticleKind = 'smoke' | 'steam' | 'spark' | 'glimmer' | 'dust';

const KINDS: ParticleKind[] = ['smoke', 'steam', 'spark', 'glimmer', 'dust'];
const KIND_INDEX: Record<ParticleKind, number> = { smoke: 0, steam: 1, spark: 2, glimmer: 3, dust: 4 };

/** Harte Obergrenze gleichzeitiger Partikel */
export const MAX_PARTICLES = 600;

export class ParticleSystem {
  private x = new Float32Array(MAX_PARTICLES);
  private y = new Float32Array(MAX_PARTICLES);
  private vx = new Float32Array(MAX_PARTICLES);
  private vy = new Float32Array(MAX_PARTICLES);
  private age = new Float32Array(MAX_PARTICLES);
  private life = new Float32Array(MAX_PARTICLES);
  private size = new Float32Array(MAX_PARTICLES);
  private grow = new Float32Array(MAX_PARTICLES);
  private kind = new Uint8Array(MAX_PARTICLES);
  private tint = new Float32Array(MAX_PARTICLES);
  count = 0;
  /** Dauer des letzten Frames in Sekunden (für ratenbasiertes Emittieren in draw()) */
  frameDt = 1 / 60;
  private lastTime = -1;
  private wind = 0.35;

  /** Ein Partikel erzeugen; wird stillschweigend verworfen, wenn der Pool voll ist. */
  emit(kind: ParticleKind, x: number, y: number, vx: number, vy: number, life: number, size: number, grow = 0, tint = 0): void {
    if (this.count >= MAX_PARTICLES) return;
    const i = this.count++;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.age[i] = 0;
    this.life[i] = life;
    this.size[i] = size;
    this.grow[i] = grow;
    this.kind[i] = KIND_INDEX[kind];
    this.tint[i] = tint;
  }

  /** Emittiert im Mittel `perSecond` Partikel pro Sekunde (zufällig über die Frames verteilt). Gibt zurück, ob eins entstand. */
  emitRate(perSecond: number, make: () => void): void {
    let n = perSecond * this.frameDt;
    while (n > 0) {
      if (n >= 1 || Math.random() < n) make();
      n -= 1;
    }
  }

  update(dt: number): void {
    const d = Math.min(0.1, dt);
    for (let i = 0; i < this.count; ) {
      this.age[i]! += d;
      if (this.age[i]! >= this.life[i]!) {
        const l = --this.count; // letzten Partikel an diese Stelle ziehen
        if (i !== l) this.copy(l, i);
        continue;
      }
      const k = this.kind[i]!;
      this.x[i]! += (this.vx[i]! + (k <= 1 ? this.wind : 0)) * d;
      this.y[i]! += this.vy[i]! * d;
      this.size[i]! += this.grow[i]! * d;
      if (k === 2) this.vy[i]! += 2.2 * d; // Funken fallen
      i++;
    }
  }

  private copy(from: number, to: number): void {
    this.x[to] = this.x[from]!;
    this.y[to] = this.y[from]!;
    this.vx[to] = this.vx[from]!;
    this.vy[to] = this.vy[from]!;
    this.age[to] = this.age[from]!;
    this.life[to] = this.life[from]!;
    this.size[to] = this.size[from]!;
    this.grow[to] = this.grow[from]!;
    this.kind[to] = this.kind[from]!;
    this.tint[to] = this.tint[from]!;
  }

  /** Zeichnet alle Partikel im sichtbaren Bereich (Weltkoordinaten). */
  draw(ctx: CanvasRenderingContext2D, view: View, time: number): void {
    if (this.lastTime >= 0) this.frameDt = Math.min(0.1, Math.max(0.001, time - this.lastTime));
    this.update(this.lastTime >= 0 ? time - this.lastTime : 0);
    this.lastTime = time;
    const minX = view.minX - 2;
    const maxX = view.maxX + 3;
    const minY = view.minY - 3;
    const maxY = view.maxY + 3;
    for (let i = 0; i < this.count; i++) {
      const px = this.x[i]!;
      const py = this.y[i]!;
      if (px < minX || px > maxX || py < minY || py > maxY) continue;
      const t = this.age[i]! / this.life[i]!;
      const s = this.size[i]!;
      switch (KINDS[this.kind[i]!]) {
        case 'smoke': {
          const g = Math.round(60 + 40 * this.tint[i]! + 30 * t);
          ctx.fillStyle = `rgba(${g},${g},${g + 4},${0.5 * (1 - t) * Math.min(1, t * 8)})`;
          break;
        }
        case 'steam':
          ctx.fillStyle = `rgba(235,242,248,${0.42 * (1 - t) * Math.min(1, t * 6)})`;
          break;
        case 'spark':
          ctx.fillStyle = `rgba(255,${Math.round(210 - 110 * t)},${Math.round(120 - 90 * t)},${1 - t})`;
          break;
        case 'glimmer':
          ctx.fillStyle = `rgba(156,255,58,${0.85 * (1 - t) * Math.min(1, t * 5)})`;
          break;
        default: // dust
          ctx.fillStyle = `rgba(150,128,96,${0.5 * (1 - t)})`;
      }
      ctx.beginPath();
      ctx.arc(px, py, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const systems = new WeakMap<Game, ParticleSystem>();

/** Das Partikelsystem des Spiels (wird beim ersten Aufruf angelegt und an die Ebene 'effects' gehängt). */
export function particlesOf(game: Game): ParticleSystem {
  let p = systems.get(game);
  if (!p) {
    p = new ParticleSystem();
    const ps = p;
    systems.set(game, ps);
    game.renderer.addDrawHook('effects', (ctx, view) => ps.draw(ctx, view, view.time), -1000);
  }
  return p;
}
