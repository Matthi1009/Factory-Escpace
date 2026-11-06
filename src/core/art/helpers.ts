// Gemeinsame Zeichen-Helfer des Industrie-Looks. Alle Koordinaten in Kacheln, Ursprung = Gebäudemitte,
// y nach unten. Richtungen: 0 = oben (N), 1 = rechts, 2 = unten, 3 = links.
import { alpha, mix, PALETTE, SHADOW_OFFSET, shade } from './palette';

const VEC = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/** Zeichnet fn in einem um dir (0..3, je 90°) gedrehten Raum („vorne“ = oben). Für richtungsabhängige Teile. */
export function withDir(ctx: CanvasRenderingContext2D, dir: number, fn: () => void): void {
  ctx.save();
  ctx.rotate((dir * Math.PI) / 2);
  fn();
  ctx.restore();
}

/** Weicher Schatten nach unten rechts (mehrere abnehmende Schichten, ohne ctx.filter). */
export function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: { radius?: number; alpha?: number } = {}): void {
  const r = o.radius ?? 0.08;
  const a = o.alpha ?? 0.3;
  ctx.save();
  for (let i = 3; i >= 0; i--) {
    const grow = i * 0.025;
    ctx.fillStyle = `rgba(6,8,12,${a * (0.25 + (3 - i) * 0.25)})`;
    roundRectPath(ctx, x + SHADOW_OFFSET.x - grow, y + SHADOW_OFFSET.y - grow, w + grow * 2, h + grow * 2, r + grow);
    ctx.fill();
  }
  ctx.restore();
}

export interface PanelOptions {
  fill?: string;
  radius?: number;
  /** Breite der hellen/dunklen Kante */
  bevel?: number;
  /** Panel-Fugen: 'h' waagerecht, 'v' senkrecht, 'both' */
  seam?: 'h' | 'v' | 'both';
  outline?: string | null;
}

/** Abgerundete Metallplatte mit heller Oberkante (oben/links), dunkler Unterkante (unten/rechts) und optionalen Fugen. */
export function drawMetalPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: PanelOptions = {}): void {
  const fill = o.fill ?? PALETTE.steelMid;
  const r = o.radius ?? 0.06;
  const b = o.bevel ?? 0.02;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(fill, 0.16));
  g.addColorStop(0.5, fill);
  g.addColorStop(1, shade(fill, -0.2));
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = g;
  ctx.fill();
  if (o.outline !== null) {
    ctx.strokeStyle = o.outline ?? PALETTE.outline;
    ctx.lineWidth = 0.022;
    ctx.stroke();
  }
  // Kanten
  ctx.lineCap = 'round';
  ctx.lineWidth = b;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.moveTo(x + r, y + b);
  ctx.lineTo(x + w - r, y + b);
  ctx.moveTo(x + b, y + r);
  ctx.lineTo(x + b, y + h - r);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.moveTo(x + r, y + h - b);
  ctx.lineTo(x + w - r, y + h - b);
  ctx.moveTo(x + w - b, y + r);
  ctx.lineTo(x + w - b, y + h - r);
  ctx.stroke();
  if (o.seam) {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.012;
    ctx.beginPath();
    if (o.seam === 'h' || o.seam === 'both') {
      ctx.moveTo(x + 0.04, y + h / 2);
      ctx.lineTo(x + w - 0.04, y + h / 2);
    }
    if (o.seam === 'v' || o.seam === 'both') {
      ctx.moveTo(x + w / 2, y + 0.04);
      ctx.lineTo(x + w / 2, y + h - 0.04);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.translate(0.01, 0.01);
    ctx.stroke();
    ctx.translate(-0.01, -0.01);
  }
}

/** Schräge Warnstreifen (Gelb/Schwarz) in einem Rechteck. */
export function drawHazardStripes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  o: { stripe?: number; radius?: number; a?: string; b?: string } = {},
): void {
  const s = o.stripe ?? 0.09;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, o.radius ?? 0.02);
  ctx.clip();
  ctx.fillStyle = o.b ?? PALETTE.hazardBlack;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = o.a ?? PALETTE.hazard;
  const span = w + h;
  for (let t = -h; t < span; t += s * 2) {
    ctx.beginPath();
    ctx.moveTo(x + t, y + h);
    ctx.lineTo(x + t + s, y + h);
    ctx.lineTo(x + t + s + h, y);
    ctx.lineTo(x + t + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Vier Schrauben in den Ecken eines Rechtecks (nur bei hohem Detailgrad sinnvoll). */
export function drawBolts(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: { inset?: number; r?: number; color?: string } = {}): void {
  const i = o.inset ?? 0.07;
  const r = o.r ?? 0.026;
  const c = o.color ?? PALETTE.steelLight;
  for (const [bx, by] of [
    [x + i, y + i],
    [x + w - i, y + i],
    [x + i, y + h - i],
    [x + w - i, y + h - i],
  ] as const) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(bx + 0.008, by + 0.01, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Rohranschluss: ein Stutzen mit Flansch, der von (x, y) in Richtung dir ragt. */
export function drawPipeStub(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, o: { len?: number; width?: number; color?: string } = {}): void {
  const len = o.len ?? 0.12;
  const wd = o.width ?? 0.2;
  const col = o.color ?? PALETTE.steelLight;
  const [dx, dy] = VEC[dir]!;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((dir * Math.PI) / 2);
  // lokal: Stutzen ragt nach oben (-y)
  const g = ctx.createLinearGradient(-wd / 2, 0, wd / 2, 0);
  g.addColorStop(0, shade(col, -0.25));
  g.addColorStop(0.35, shade(col, 0.2));
  g.addColorStop(1, shade(col, -0.35));
  ctx.fillStyle = g;
  ctx.fillRect(-wd / 2, -len, wd, len);
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 0.016;
  ctx.strokeRect(-wd / 2, -len, wd, len);
  // Flansch am Ende
  ctx.fillStyle = shade(col, -0.05);
  roundRectPath(ctx, -wd / 2 - 0.02, -len - 0.025, wd + 0.04, 0.045, 0.012);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  void dx;
  void dy;
}

/** Lüfter mit Gitter. rotation in Radiant. */
export function drawFan(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number, o: { blades?: number; grille?: boolean; color?: string } = {}): void {
  const blades = o.blades ?? 5;
  const col = o.color ?? PALETTE.steelLight;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = PALETTE.steelDeep;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.steelMid;
  ctx.lineWidth = r * 0.14;
  ctx.stroke();
  ctx.rotate(rotation);
  ctx.fillStyle = col;
  for (let i = 0; i < blades; i++) {
    ctx.rotate((Math.PI * 2) / blades);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.55, -r * 0.45, r * 0.85, -r * 0.1);
    ctx.quadraticCurveTo(r * 0.5, r * 0.05, 0, 0);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.steelMid;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(-rotation);
  if (o.grille !== false) {
    ctx.strokeStyle = 'rgba(200,210,220,0.35)';
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();
  }
  ctx.restore();
}

export type LedState = 'run' | 'wait' | 'stop' | 'off';

const LED_COLOR: Record<LedState, string> = { run: PALETTE.ledRun, wait: PALETTE.ledWait, stop: PALETTE.ledStop, off: PALETTE.ledOff };

/** Status-LED: grün = läuft, gelb = wartet (Input fehlt / Output voll), rot = kein Strom oder blockiert, grau = aus. */
export function drawStatusLed(ctx: CanvasRenderingContext2D, x: number, y: number, state: LedState, time = 0, o: { size?: number; glow?: boolean } = {}): void {
  const r = o.size ?? 0.05;
  ctx.fillStyle = PALETTE.steelDeep;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.45, 0, Math.PI * 2);
  ctx.fill();
  const pulse = state === 'run' ? 0.85 + 0.15 * Math.sin(time * 4) : state === 'stop' ? (Math.floor(time * 2.5) % 2 ? 1 : 0.55) : 1;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = LED_COLOR[state];
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  if (o.glow !== false && state !== 'off') drawGlow(ctx, x, y, r * 3.2, LED_COLOR[state], 0.55 * pulse);
}

// ---------- Glühen ----------
const glowCache = new Map<string, HTMLCanvasElement>();

function glowSprite(color: string): HTMLCanvasElement {
  let c = glowCache.get(color);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, alpha(color, 1));
    grad.addColorStop(0.35, alpha(color, 0.45));
    grad.addColorStop(1, alpha(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    glowCache.set(color, c);
  }
  return c;
}

/** Weicher Lichtschein (additiv gemischt). Nutzt einen gecachten Radial-Verlauf, daher günstig pro Frame. */
export function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 1): void {
  const prev = ctx.globalAlpha;
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(1, Math.max(0, a)) * prev;
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = op;
  ctx.globalAlpha = prev;
}

/** Kleiner Hilfs-Helfer: Farbverlauf zwischen Glut-Farben (t = 0 dunkel, 1 hell). */
export function emberColor(t: number): string {
  return mix(PALETTE.ember, PALETTE.emberLight, Math.min(1, Math.max(0, t)));
}
