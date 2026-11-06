// Smog-Overlay: Die Verschmutzung wird nach jedem Simulationsschritt in eine 256×256-Textur gemalt
// und auf Ebene 'overlay' weich hochskaliert gezeichnet (eine drawImage pro Frame statt 65 536 Rechtecke).
import type { Game } from '../../core';
import { ENV_CONFIG } from './config';

const C = ENV_CONFIG.overlay;

export class PollutionOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private image: ImageData;
  /** Overlay ein-/ausschalten (später z. B. per Taste in der ui) */
  visible = true;
  /** Bereich mit sichtbarem Smog (in Kacheln, inklusive); minX > maxX = kein Smog */
  private box = { minX: 1, minY: 1, maxX: 0, maxY: 0 };

  constructor(private game: Game) {
    const { width, height } = game.world;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.image = this.ctx.createImageData(width, height);
    game.renderer.addDrawHook('overlay', (ctx, view) => {
      const b = this.box;
      if (!this.visible || b.minX > b.maxX) return;
      // nur der Teil, der sichtbar ist UND Smog enthält (spart Füllrate)
      const x0 = Math.max(0, view.minX - 1, b.minX - 1);
      const y0 = Math.max(0, view.minY - 1, b.minY - 1);
      const w = Math.min(width, view.maxX + 2, b.maxX + 2) - x0;
      const h = Math.min(height, view.maxY + 2, b.maxY + 2) - y0;
      if (w <= 0 || h <= 0) return;
      ctx.imageSmoothingEnabled = true; // weiche Wolken statt Kacheln
      ctx.drawImage(this.canvas, x0, y0, w, h, x0, y0, w, h);
    });
  }

  /** Textur aus den aktuellen Verschmutzungswerten neu einfärben. */
  update(): void {
    const p = this.game.env.field('pollution');
    const data = this.image.data;
    const w = this.game.world.width;
    const box = { minX: Infinity, minY: Infinity, maxX: -1, maxY: -1 };
    for (let i = 0; i < p.length; i++) {
      const v = p[i]!;
      const o = i * 4;
      const a = v > 0 ? C.maxAlpha * (1 - Math.exp(-v / C.scale)) : 0;
      if (a < 0.01) {
        data[o + 3] = 0;
        continue;
      }
      const x = i % w;
      const y = (i - x) / w;
      if (x < box.minX) box.minX = x;
      if (x > box.maxX) box.maxX = x;
      if (y < box.minY) box.minY = y;
      if (y > box.maxY) box.maxY = y;
      // je dichter, desto giftiger: von Braungrau zu Schwefelgelb-Grün
      const t = Math.min(1, v / (C.scale * 4));
      data[o] = 95 + 60 * t;
      data[o + 1] = 80 + 70 * t;
      data[o + 2] = 55 - 25 * t;
      data[o + 3] = a * 255;
    }
    this.box = box.maxX < 0 ? { minX: 1, minY: 1, maxX: 0, maxY: 0 } : box;
    this.ctx.putImageData(this.image, 0, 0);
  }
}
