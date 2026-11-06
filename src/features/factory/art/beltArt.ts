// Förderband: Gummiband mit Pfeil-Rillen, die in Bandrichtung laufen, Stahl-Seitenschienen, saubere Kurven.
// Die Kurve entsteht automatisch, wenn das Band nur von der Seite gespeist wird.
import { PALETTE, drawBuildingSprite, roundRectPath, shade, withDir, type Lod } from '../../../core';
import type { Building } from '../../../core';
import { dirAngle } from '../../../core';

/** Bandgeschwindigkeit der Rillen in Kacheln pro Sekunde (entspricht der Spiel-Geschwindigkeit) */
const RIDGE_SPEED = 1.8;
const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

export type BeltShape = 'straight' | 'curveL' | 'curveR';

interface BeltLike extends Building {
  readonly game: { world: { getBuilding(x: number, y: number): Building | null } };
}

/** Gerade oder Kurve? Kurve, wenn hinten nichts liefert und genau eine Seite ein Band hineinschiebt. */
export function beltShape(b: BeltLike): BeltShape {
  const w = b.game.world;
  const at = (d: number) => w.getBuilding(b.x + DIRS[d]![0], b.y + DIRS[d]![1]);
  const behind = at((b.dir + 2) % 4);
  if (behind && behind.dir === b.dir) return 'straight'; // liefert von hinten (Band oder Maschine)
  const left = at((b.dir + 3) % 4);
  const right = at((b.dir + 1) % 4);
  const feedL = !!left && left.def.id === 'factory:belt' && left.dir === (b.dir + 1) % 4;
  const feedR = !!right && right.def.id === 'factory:belt' && right.dir === (b.dir + 3) % 4;
  if (feedL && !feedR) return 'curveL';
  if (feedR && !feedL) return 'curveR';
  return 'straight';
}

function rail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, shade(PALETTE.steelMid, 0.2));
  g.addColorStop(0.5, PALETTE.steelMid);
  g.addColorStop(1, shade(PALETTE.steelMid, -0.3));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function paintStraight(ctx: CanvasRenderingContext2D, lod: Lod, dir: number): void {
  withDir(ctx, dir, () => {
    // Gummiband
    ctx.fillStyle = PALETTE.rubber;
    ctx.fillRect(-0.36, -0.5, 0.72, 1);
    if (lod >= 1) {
      ctx.fillStyle = PALETTE.rubberLight;
      ctx.fillRect(-0.34, -0.5, 0.025, 1);
      ctx.fillRect(0.315, -0.5, 0.025, 1);
    }
    // Seitenschienen
    rail(ctx, -0.5, -0.5, 0.14, 1);
    rail(ctx, 0.36, -0.5, 0.14, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(-0.5, -0.5, 0.02, 1);
    ctx.fillRect(0.36, -0.5, 0.02, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-0.36, -0.5, 0.012, 1);
    ctx.fillRect(0.5 - 0.012, -0.5, 0.012, 1);
    if (lod >= 2) {
      // Nieten auf den Schienen
      ctx.fillStyle = PALETTE.steelLight;
      for (const y of [-0.3, 0.3]) {
        ctx.beginPath();
        ctx.arc(-0.43, y, 0.018, 0, Math.PI * 2);
        ctx.arc(0.43, y, 0.018, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Stoßfugen an den Kachelenden
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-0.5, -0.5, 1, 0.012);
    ctx.fillRect(-0.5, 0.488, 1, 0.012);
  });
  lightOverlay(ctx);
}

/** Kurve: Viertelring um die Ecke (-0.5, -0.5), von der linken Kante zur oberen Kante (im lokalen Raum). */
function paintCurve(ctx: CanvasRenderingContext2D, lod: Lod, dir: number, mirror: boolean): void {
  withDir(ctx, dir, () => {
    if (mirror) ctx.scale(-1, 1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-0.5, -0.5, 1, 1);
    ctx.clip();
    const cx = -0.5;
    const cy = -0.5;
    const ring = (r0: number, r1: number, fill: string | CanvasGradient) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r1, 0, Math.PI / 2);
      ctx.arc(cx, cy, r0, Math.PI / 2, 0, true);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };
    ring(0.14, 0.86, PALETTE.rubber);
    // Schienen innen und außen
    ring(0.0, 0.14, shade(PALETTE.steelMid, -0.1));
    ring(0.86, 1.0, shade(PALETTE.steelMid, -0.1));
    ctx.lineWidth = 0.014;
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(cx, cy, 0.14, 0, Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, 0.86, 0, Math.PI / 2);
    ctx.stroke();
    if (lod >= 1) {
      ctx.strokeStyle = PALETTE.rubberLight;
      ctx.lineWidth = 0.02;
      for (const r of [0.19, 0.81]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI / 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  });
  lightOverlay(ctx);
}

/** Einheitliches Licht von oben links über der ganzen Kachel (nach dem Entdrehen, also Bildschirm-ausgerichtet). */
function lightOverlay(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(-0.5, -0.5, 0.5, 0.5);
  g.addColorStop(0, 'rgba(255,255,255,0.1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = g;
  roundRectPath(ctx, -0.5, -0.5, 1, 1, 0);
  ctx.fill();
}

export function drawBelt(ctx: CanvasRenderingContext2D, b: BeltLike, time: number): void {
  const shape = beltShape(b);
  drawBuildingSprite(
    ctx,
    b,
    `belt|${shape}`,
    (c, lod) => (shape === 'straight' ? paintStraight(c, lod, b.dir) : paintCurve(c, lod, b.dir, shape === 'curveR')),
    (c, lod) => {
      if (lod < 1) return; // weit herausgezoomt: keine Rillen-Animation
      c.rotate(dirAngle(b.dir)); // zurück in den Raum „vorne = oben“
      c.beginPath();
      c.rect(-0.36, -0.47, 0.72, 0.94);
      if (shape !== 'straight') c.rect(-0.5, -0.47, 0.14, 0.94);
      c.clip();
      if (shape === 'straight') {
        // Pfeil-Rillen laufen nach vorne (nach oben)
        c.lineWidth = 0.05;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        for (let k = 0; k < 4; k++) {
          const y = 0.62 - ((time * RIDGE_SPEED + k * 0.25) % 1);
          c.strokeStyle = PALETTE.rubberLight;
          c.beginPath();
          c.moveTo(-0.27, y + 0.1);
          c.lineTo(0, y - 0.03);
          c.lineTo(0.27, y + 0.1);
          c.stroke();
          if (lod >= 2) {
            c.strokeStyle = 'rgba(255,255,255,0.1)';
            c.lineWidth = 0.014;
            c.beginPath();
            c.moveTo(-0.27, y + 0.085);
            c.lineTo(0, y - 0.045);
            c.lineTo(0.27, y + 0.085);
            c.stroke();
            c.lineWidth = 0.05;
          }
        }
      } else {
        // Kurve: Rillen wandern auf dem Viertelkreis von der Seite nach vorne
        c.save();
        if (shape === 'curveR') c.scale(-1, 1);
        c.lineWidth = 0.05;
        c.lineCap = 'round';
        c.strokeStyle = PALETTE.rubberLight;
        const cx = -0.5;
        const cy = -0.5;
        for (let k = 0; k < 3; k++) {
          const theta = Math.PI / 2 - ((time * (RIDGE_SPEED / 0.5) + k * (Math.PI / 6)) % (Math.PI / 2));
          c.beginPath();
          c.moveTo(cx + Math.cos(theta) * 0.2, cy + Math.sin(theta) * 0.2);
          c.lineTo(cx + Math.cos(theta) * 0.8, cy + Math.sin(theta) * 0.8);
          c.stroke();
        }
        c.restore();
      }
    },
  );
}
