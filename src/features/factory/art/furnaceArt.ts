// Ofen: dunkles Stahlgehäuse mit orangem Rahmen, Glut-Kammer mit Gitter, Schornstein, Rohranschlüsse.
// Statisch (gecacht): Gehäuse, Kammer, Anschlüsse. Animiert: Glut, LED, Rauch und Funken.
import {
  PALETTE,
  alpha,
  drawBolts,
  drawGlow,
  drawHazardStripes,
  drawMetalPanel,
  drawPipeStub,
  drawShadow,
  drawStatusLed,
  drawBuildingSprite,
  emberColor,
  lodOf,
  particlesOf,
  pxPerTile,
  roundRectPath,
  withDir,
  type Lod,
  type LedState,
} from '../../../core';
import { localToWorld, seedOf, type ArtBuilding } from './common';

export interface FurnaceLook {
  /** Glut 0..1 (0 = kalt) */
  heat: number;
  led: LedState;
  /** Heller/dunkler Gehäuse-Akzent: 'orange' (normal) oder 'eco' (Öko-Ofen) */
  accent?: 'orange' | 'eco';
}

function paintFurnace(ctx: CanvasRenderingContext2D, lod: Lod, dir: number, accent: string): void {
  drawShadow(ctx, -0.46, -0.46, 0.92, 0.92, { radius: 0.1 });
  drawMetalPanel(ctx, -0.46, -0.46, 0.92, 0.92, { fill: PALETTE.steelMid, radius: 0.1 });
  // farbiger Rahmen
  ctx.strokeStyle = accent;
  ctx.lineWidth = 0.035;
  roundRectPath(ctx, -0.4, -0.4, 0.8, 0.8, 0.07);
  ctx.stroke();
  // Innenplatte
  drawMetalPanel(ctx, -0.35, -0.35, 0.7, 0.7, { fill: PALETTE.steelDark, radius: 0.06, outline: PALETTE.steelDeep });
  // Glut-Kammer (Öffnung)
  ctx.fillStyle = '#100b09';
  roundRectPath(ctx, -0.24, -0.2, 0.48, 0.4, 0.05);
  ctx.fill();
  ctx.strokeStyle = PALETTE.steelLight;
  ctx.lineWidth = 0.025;
  ctx.stroke();
  if (lod >= 1) {
    // Seitliche Lüftungsschlitze
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 0.016;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(-0.3, i * 0.065);
      ctx.lineTo(-0.265, i * 0.065);
      ctx.moveTo(0.265, i * 0.065);
      ctx.lineTo(0.3, i * 0.065);
    }
    ctx.stroke();
  }
  if (lod >= 2) drawBolts(ctx, -0.46, -0.46, 0.92, 0.92, { inset: 0.065 });

  withDir(ctx, dir, () => {
    // Ausgang vorne (oben): Warnstreifen-Lippe + Rohrstutzen + Pfeil
    drawHazardStripes(ctx, -0.22, -0.452, 0.44, 0.075, { stripe: 0.06 });
    drawPipeStub(ctx, 0, -0.455, 0, { len: lod >= 1 ? 0.11 : 0.08, width: 0.2 });
    if (lod >= 1) {
      ctx.fillStyle = PALETTE.orangeLight;
      ctx.beginPath();
      ctx.moveTo(0, -0.33);
      ctx.lineTo(0.07, -0.265);
      ctx.lineTo(-0.07, -0.265);
      ctx.closePath();
      ctx.fill();
    }
    // Eingang hinten (unten): Trichter-Flansch mit Pfeil nach innen
    ctx.fillStyle = PALETTE.steelDeep;
    ctx.beginPath();
    ctx.moveTo(-0.17, 0.46);
    ctx.lineTo(0.17, 0.46);
    ctx.lineTo(0.12, 0.35);
    ctx.lineTo(-0.12, 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.steelLight;
    ctx.lineWidth = 0.02;
    ctx.stroke();
    if (lod >= 1) {
      ctx.fillStyle = PALETTE.orangeLight;
      ctx.beginPath();
      ctx.moveTo(0, 0.39);
      ctx.lineTo(0.05, 0.43);
      ctx.lineTo(-0.05, 0.43);
      ctx.closePath();
      ctx.fill();
    }
    // Schornstein hinten rechts
    const cx = 0.27;
    const cy = 0.27;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(cx + 0.015, cy + 0.02, 0.085, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(cx - 0.02, cy - 0.02, 0.01, cx, cy, 0.085);
    g.addColorStop(0, PALETTE.steelLight);
    g.addColorStop(1, PALETTE.steelMid);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0807';
    ctx.beginPath();
    ctx.arc(cx, cy, 0.05, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function drawFurnace(ctx: CanvasRenderingContext2D, b: ArtBuilding, time: number, look: FurnaceLook): void {
  const accent = look.accent === 'eco' ? PALETTE.eco : PALETTE.orange;
  drawBuildingSprite(
    ctx,
    b,
    `furnace|${look.accent ?? 'orange'}`,
    (c, lod) => paintFurnace(c, lod, b.dir, accent),
    (c, lod) => {
      const seed = seedOf(b);
      const flick = 0.82 + 0.18 * Math.sin(time * 9 + seed * 40) * Math.sin(time * 4.3 + seed * 11);
      const h = look.heat * flick;
      if (look.heat > 0.02) {
        // Glühende Kammer: Farbfläche + Lichtschein, darüber das Gitter
        c.fillStyle = emberColor(0.02 + 0.3 * h);
        c.globalAlpha = 0.4 + 0.6 * look.heat;
        roundRectPath(c, -0.21, -0.17, 0.42, 0.34, 0.04);
        c.fill();
        c.globalAlpha = 1;
        // heller Kern in der Mitte der Kammer, weicher Schein nach außen
        drawGlow(c, 0, 0, 0.22, PALETTE.emberLight, 0.55 * h);
        drawGlow(c, 0, 0, 0.6, PALETTE.ember, 0.6 * h);
        if (lod >= 1) {
          c.strokeStyle = alpha('#2a0e04', 0.8);
          c.lineWidth = 0.022;
          c.beginPath();
          for (let i = -2; i <= 2; i++) {
            c.moveTo(-0.2 + (i + 2) * 0.1, -0.17);
            c.lineTo(-0.2 + (i + 2) * 0.1, 0.17);
          }
          c.stroke();
        }
      } else if (lod >= 1) {
        c.strokeStyle = 'rgba(70,60,56,0.9)';
        c.lineWidth = 0.022;
        c.beginPath();
        for (let i = -2; i <= 2; i++) {
          c.moveTo(-0.2 + (i + 2) * 0.1, -0.17);
          c.lineTo(-0.2 + (i + 2) * 0.1, 0.17);
        }
        c.stroke();
      }
      if (lod >= 1) drawStatusLed(c, -0.28, -0.28, look.led, time + seed * 3, { glow: lod >= 2 });
      // Rauch und Funken (nur sichtbar und nur ab mittlerem Detail)
      if (lod >= 1 && look.heat > 0.3 && pxPerTile(c) >= 20) {
        const ps = particlesOf(b.game);
        const chimney = localToWorld(b, 0.27, 0.27);
        ps.emitRate(2.2, () => ps.emit('smoke', chimney.x + (Math.random() - 0.5) * 0.04, chimney.y, (Math.random() - 0.5) * 0.08, -0.3 - Math.random() * 0.12, 1.6 + Math.random() * 0.9, 0.05, 0.05, Math.random()));
        if (lod >= 2) {
          const hot = localToWorld(b, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2);
          ps.emitRate(3, () => ps.emit('spark', hot.x, hot.y, (Math.random() - 0.5) * 0.9, -0.5 - Math.random() * 0.6, 0.35 + Math.random() * 0.3, 0.018));
        }
      }
    },
  );
  void lodOf;
}
