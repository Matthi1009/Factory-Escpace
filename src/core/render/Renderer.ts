// Canvas-2D-Renderer: Vollbild, HiDPI-scharf, Kamera, vorgerenderter Boden, feste Ebenen mit Draw-Hooks.
import { Camera } from './Camera';
import { RESOURCES } from '../content/resources';
import { TERRAINS } from '../content/terrain';
import { hash2 } from '../random';
import type { World } from '../world/World';

/** Ebenen in Zeichenreihenfolge. 'screen' ist Bildschirm-Raum (CSS-Pixel) statt Welt-Raum. */
export const RENDER_LAYERS = ['ground', 'overlay', 'buildings', 'items', 'entities', 'effects', 'ui-world', 'screen'] as const;
export type RenderLayer = (typeof RENDER_LAYERS)[number];

/** Sichtbarer Bereich, den jeder Draw-Hook bekommt. */
export interface View {
  /** Sichtbare Kacheln (inklusive), schon auf die Karte begrenzt */
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Pixel pro Kachel */
  zoom: number;
  /** Spielzeit in Sekunden (inkl. Interpolation) */
  time: number;
  /** Interpolation 0..1 zwischen letztem und nächstem Tick (für weiche Bewegung) */
  alpha: number;
  /** Bildschirmgröße in CSS-Pixeln */
  width: number;
  height: number;
}

export type DrawHook = (ctx: CanvasRenderingContext2D, view: View) => void;

/**
 * Malt eine Bodenkachel in den Offscreen-Canvas. (px, py) = linke obere Ecke in Pixeln, size = Pixel pro Kachel.
 * Nur innerhalb der Kachel malen (kein Clipping, aus Performance-Gründen).
 * environment kann mit setGroundPainter eine eigene Variante setzen (und defaultGroundPainter darin weiterverwenden).
 */
export type GroundPainter = (ctx: CanvasRenderingContext2D, x: number, y: number, px: number, py: number, size: number, world: World) => void;

/** Auflösung des vorgerenderten Bodens (Pixel pro Kachel). */
export const GROUND_PX = 8;

const SHADES = TERRAINS.map((t) => [shade(t.color, -0.06), t.color, shade(t.color, 0.05)]);

/** Standard-Optik des Bodens: Terrainfarbe mit leichter Variation, Bäume im Wald, Erz-Flecken. */
export const defaultGroundPainter: GroundPainter = (ctx, x, y, px, py, size, world) => {
  const i = world.index(x, y);
  const t = world.terrain[i]!;
  const h = hash2(world.seed, x, y);
  ctx.fillStyle = SHADES[t]![Math.floor(h * 3)]!;
  ctx.fillRect(px, py, size, size);
  const s = size / 8;
  if (TERRAINS[t]!.id === 'forest') {
    ctx.fillStyle = '#1f4a1d';
    ctx.fillRect(px + s * (1 + Math.floor(h * 3)), py + s * 2, s * 3, s * 3);
  }
  const r = world.resource[i]!;
  if (r > 0) {
    ctx.fillStyle = RESOURCES[r - 1]!.color;
    for (let k = 0; k < 4; k++) {
      const hx = hash2(world.seed + 7 + k, x, y);
      const hy = hash2(world.seed + 13 + k, x, y);
      ctx.fillRect(px + Math.floor(hx * 6) * s, py + Math.floor(hy * 6) * s, s * 2, s * 2);
    }
  }
};

interface HookEntry {
  fn: DrawHook;
  order: number;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly camera = new Camera();
  /** devicePixelRatio */
  dpr = 1;

  private ground: HTMLCanvasElement;
  private groundCtx: CanvasRenderingContext2D;
  private groundFull = true;
  private groundRects: { x: number; y: number; w: number; h: number }[] = [];
  private painter: GroundPainter = defaultGroundPainter;
  private hooks = new Map<RenderLayer, HookEntry[]>(RENDER_LAYERS.map((l) => [l, []]));

  constructor(container: HTMLElement, private world: World) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.ground = document.createElement('canvas');
    this.ground.width = world.width * GROUND_PX;
    this.ground.height = world.height * GROUND_PX;
    this.groundCtx = this.ground.getContext('2d')!;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /** Passt den Canvas an Fenstergröße und devicePixelRatio an. */
  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.camera.viewWidth = w;
    this.camera.viewHeight = h;
  }

  /**
   * Eigene Zeichenfunktion auf einer Ebene. ctx ist in Welt-Einheiten (1 = 1 Kachel), außer bei 'screen'.
   * order: kleinere Werte zuerst (Core benutzt negative Werte). Rückgabe: Funktion zum Entfernen.
   */
  addDrawHook(layer: RenderLayer, fn: DrawHook, order = 0): () => void {
    const list = this.hooks.get(layer)!;
    const entry = { fn, order };
    list.push(entry);
    list.sort((a, b) => a.order - b.order);
    return () => {
      const i = list.indexOf(entry);
      if (i >= 0) list.splice(i, 1);
    };
  }

  /** Boden neu rendern: ohne Argumente alles, sonst nur das Rechteck (in Kacheln). */
  invalidateGround(x?: number, y?: number, w = 1, h = 1): void {
    if (x === undefined || y === undefined) this.groundFull = true;
    else this.groundRects.push({ x, y, w, h });
  }

  /** Eigene Boden-Optik setzen (null = Standard). Rendert den Boden danach komplett neu. */
  setGroundPainter(fn: GroundPainter | null): void {
    this.painter = fn ?? defaultGroundPainter;
    this.groundFull = true;
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return this.camera.screenToWorld(sx, sy);
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return this.camera.worldToScreen(wx, wy);
  }

  /** Aktuell sichtbarer Bereich (ohne Zeit). */
  visibleArea(): { minX: number; minY: number; maxX: number; maxY: number } {
    const cam = this.camera;
    const a = cam.screenToWorld(0, 0);
    const b = cam.screenToWorld(cam.viewWidth, cam.viewHeight);
    return {
      minX: Math.max(0, Math.floor(a.x)),
      minY: Math.max(0, Math.floor(a.y)),
      maxX: Math.min(this.world.width - 1, Math.floor(b.x)),
      maxY: Math.min(this.world.height - 1, Math.floor(b.y)),
    };
  }

  /** @internal Vom Game-Loop einmal pro Frame aufgerufen. */
  _render(time: number, alpha: number): void {
    this.updateGround();
    const { ctx, camera: cam, dpr } = this;
    if (this.canvas.width !== Math.round(cam.viewWidth * dpr)) this.resize();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const view: View = { ...this.visibleArea(), zoom: cam.zoom, time, alpha, width: cam.viewWidth, height: cam.viewHeight };
    const z = cam.zoom * dpr;
    const tx = Math.round((cam.viewWidth / 2) * dpr - cam.x * z);
    const ty = Math.round((cam.viewHeight / 2) * dpr - cam.y * z);
    ctx.setTransform(z, 0, 0, z, tx, ty);
    ctx.imageSmoothingEnabled = false;

    // Boden: nur den sichtbaren Ausschnitt aus dem Offscreen-Canvas kopieren
    if (view.maxX >= view.minX && view.maxY >= view.minY) {
      const w = view.maxX - view.minX + 1;
      const h = view.maxY - view.minY + 1;
      ctx.drawImage(this.ground, view.minX * GROUND_PX, view.minY * GROUND_PX, w * GROUND_PX, h * GROUND_PX, view.minX, view.minY, w, h);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2 / cam.zoom;
    ctx.strokeRect(0, 0, this.world.width, this.world.height);

    for (const layer of RENDER_LAYERS) {
      if (layer === 'screen') ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const h of this.hooks.get(layer)!) {
        ctx.save();
        try {
          h.fn(ctx, view);
        } catch (err) {
          console.error(`[Renderer] Fehler im Draw-Hook auf Ebene '${layer}':`, err);
        }
        ctx.restore();
      }
    }
  }

  private updateGround(): void {
    const g = this.groundCtx;
    if (this.groundFull) {
      this.groundFull = false;
      this.groundRects = [];
      this.paintRect(g, 0, 0, this.world.width, this.world.height);
    } else if (this.groundRects.length) {
      for (const r of this.groundRects) this.paintRect(g, r.x, r.y, r.w, r.h);
      this.groundRects = [];
    }
  }

  private paintRect(g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number): void {
    const x1 = Math.min(this.world.width, x0 + w);
    const y1 = Math.min(this.world.height, y0 + h);
    for (let y = Math.max(0, y0); y < y1; y++)
      for (let x = Math.max(0, x0); x < x1; x++) {
        this.painter(g, x, y, x * GROUND_PX, y * GROUND_PX, GROUND_PX, this.world);
      }
  }
}

/** Hellt eine Hex-Farbe auf (amount > 0) oder dunkelt sie ab (amount < 0). */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, c + 255 * amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `rgb(${r},${g},${b})`;
}
