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

  constructor(private game: Game) {
    const { width, height } = game.world;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.image = this.ctx.createImageData(width, height);
    game.renderer.addDrawHook('overlay', (ctx, view) => {
      if (!this.visible) return;
      const x0 = Math.max(0, view.minX - 1);
      const y0 = Math.max(0, view.minY - 1);
      const w = Math.min(width, view.maxX + 2) - x0;
      const h = Math.min(height, view.maxY + 2) - y0;
      if (w <= 0 || h <= 0) return;
      ctx.imageSmoothingEnabled = true; // weiche Wolken statt Kacheln
      ctx.drawImage(this.canvas, x0, y0, w, h, x0, y0, w, h);
    });
  }

  /** Textur aus den aktuellen Verschmutzungswerten neu einfärben. */
  update(): void {
    const p = this.game.env.field('pollution');
    const data = this.image.data;
    for (let i = 0; i < p.length; i++) {
      const v = p[i]!;
      const o = i * 4;
      if (v <= 0) {
        data[o + 3] = 0;
        continue;
      }
      const a = C.maxAlpha * (1 - Math.exp(-v / C.scale));
      // je dichter, desto giftiger: von Braungrau zu Schwefelgelb-Grün
      const t = Math.min(1, v / (C.scale * 4));
      data[o] = 95 + 60 * t;
      data[o + 1] = 80 + 70 * t;
      data[o + 2] = 55 - 25 * t;
      data[o + 3] = a * 255;
    }
    this.ctx.putImageData(this.image, 0, 0);
  }
}
