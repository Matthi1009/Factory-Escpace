// Kurzlebige Effekte auf Ebene 'effects': Leuchtspuren von Schüssen, Rauch beim Tod eines Monsters.
import type { Game } from '../../core';

interface Tracer {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  color: string;
}
interface Puff {
  x: number;
  y: number;
  life: number;
  color: string;
}

export class Effects {
  private tracers: Tracer[] = [];
  private puffs: Puff[] = [];

  constructor(game: Game) {
    game.onTick(() => {
      for (const t of this.tracers) t.life -= 0.15;
      for (const p of this.puffs) p.life -= 0.03;
      this.tracers = this.tracers.filter((t) => t.life > 0);
      this.puffs = this.puffs.filter((p) => p.life > 0);
    });
    game.renderer.addDrawHook('effects', (ctx, view) => {
      ctx.lineCap = 'round';
      for (const t of this.tracers) {
        ctx.strokeStyle = t.color;
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.lineWidth = 0.08;
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
      }
      for (const p of this.puffs) {
        if (p.x < view.minX - 2 || p.x > view.maxX + 2 || p.y < view.minY - 2 || p.y > view.maxY + 2) continue;
        ctx.globalAlpha = Math.max(0, p.life) * 0.7;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.25 + (1 - p.life) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  tracer(x1: number, y1: number, x2: number, y2: number, color = '#ffe28a'): void {
    this.tracers.push({ x1, y1, x2, y2, life: 1, color });
  }

  puff(x: number, y: number, color = '#7a7a5a'): void {
    this.puffs.push({ x, y, life: 1, color });
  }
}
