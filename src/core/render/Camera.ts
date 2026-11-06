// Kamera: Mittelpunkt in Kacheln, Zoom in Pixel pro Kachel (CSS-Pixel).
import { WORLD_SIZE } from '../world/World';

export class Camera {
  static readonly MIN_ZOOM = 8;
  static readonly MAX_ZOOM = 64;

  /** Mittelpunkt in Weltkoordinaten (Kacheln) */
  x = WORLD_SIZE / 2;
  y = WORLD_SIZE / 2;
  /** Pixel pro Kachel */
  zoom = 32;
  /** Größe des Bildschirms in CSS-Pixeln (setzt der Renderer) */
  viewWidth = 1;
  viewHeight = 1;

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: this.x + (sx - this.viewWidth / 2) / this.zoom,
      y: this.y + (sy - this.viewHeight / 2) / this.zoom,
    };
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: (wx - this.x) * this.zoom + this.viewWidth / 2,
      y: (wy - this.y) * this.zoom + this.viewHeight / 2,
    };
  }

  /** Verschiebt die Kamera um (dx, dy) Kacheln. */
  pan(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
    this.clamp();
  }

  /** Zoomt um factor, sodass der Weltpunkt unter (sx, sy) an derselben Bildschirmstelle bleibt. */
  zoomAt(factor: number, sx: number, sy: number): void {
    const before = this.screenToWorld(sx, sy);
    this.zoom = Math.min(Camera.MAX_ZOOM, Math.max(Camera.MIN_ZOOM, this.zoom * factor));
    const after = this.screenToWorld(sx, sy);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this.clamp();
  }

  centerOn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.clamp();
  }

  clamp(): void {
    this.x = Math.min(WORLD_SIZE, Math.max(0, this.x));
    this.y = Math.min(WORLD_SIZE, Math.max(0, this.y));
  }
}
