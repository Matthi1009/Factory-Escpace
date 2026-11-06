// Abbaumaschine: oranges Gehäuse, rotierender Bohrkopf im Schacht, Ausgangsstutzen mit Pfeil.
// Mk1 (Kohle): Kohle-Luke und Schornstein mit Rauch. Mk2 (Strom): Cyan-Spulen.
import {
  PALETTE,
  alpha,
  drawBolts,
  drawBuildingSprite,
  drawGlow,
  drawHazardStripes,
  drawMetalPanel,
  drawPipeStub,
  drawShadow,
  drawStatusLed,
  particlesOf,
  pxPerTile,
  roundRectPath,
  shade,
  withDir,
  type LedState,
  type Lod,
} from '../../../core';
import { localToWorld, seedOf, type ArtBuilding } from './common';

export type MinerVariant = 'mk1' | 'mk2';

export interface MinerLook {
  /** Bohrkopf dreht sich */
  working: boolean;
  /** Maschinenfarbe/Antrieb: Mk1 (Kohle) oder Mk2 (Strom) */
  variant: MinerVariant;
  led: LedState;
  /** Mk2: Versorgung 0..1 für das Spulen-Leuchten */
  power?: number;
}

function paintMiner(ctx: CanvasRenderingContext2D, lod: Lod, dir: number, variant: MinerVariant): void {
  drawShadow(ctx, -0.46, -0.46, 0.92, 0.92, { radius: 0.1 });
  drawMetalPanel(ctx, -0.46, -0.46, 0.92, 0.92, { fill: PALETTE.orange, radius: 0.1 });
  drawMetalPanel(ctx, -0.36, -0.36, 0.72, 0.72, { fill: PALETTE.steelMid, radius: 0.06, outline: PALETTE.steelDeep });
  // Bohrschacht: Ring + dunkler Schacht
  const g = ctx.createRadialGradient(-0.05, -0.05, 0.04, 0, 0, 0.27);
  g.addColorStop(0, PALETTE.steelLight);
  g.addColorStop(1, PALETTE.steelMid);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 0.022;
  ctx.stroke();
  ctx.fillStyle = '#0e1013';
  ctx.beginPath();
  ctx.arc(0, 0, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.arc(0.012, 0.014, 0.19, 0, Math.PI * 2);
  ctx.stroke();
  if (lod >= 1) {
    // Warnstreifen in den Gehäuse-Ecken (links unten / rechts oben)
    drawHazardStripes(ctx, -0.435, 0.27, 0.15, 0.13, { stripe: 0.05, radius: 0.03 });
    drawHazardStripes(ctx, 0.285, -0.4, 0.15, 0.13, { stripe: 0.05, radius: 0.03 });
  }
  if (lod >= 2) drawBolts(ctx, -0.46, -0.46, 0.92, 0.92, { inset: 0.055, color: PALETTE.orangeLight });

  withDir(ctx, dir, () => {
    // Ausgang vorne: Pfeil-Schlitz und Rohrstutzen
    ctx.fillStyle = PALETTE.steelDeep;
    roundRectPath(ctx, -0.11, -0.345, 0.22, 0.075, 0.02);
    ctx.fill();
    ctx.fillStyle = PALETTE.orangeLight;
    ctx.beginPath();
    ctx.moveTo(0, -0.335);
    ctx.lineTo(0.06, -0.28);
    ctx.lineTo(0.02, -0.28);
    ctx.lineTo(0.02, -0.285);
    ctx.lineTo(-0.02, -0.285);
    ctx.lineTo(-0.02, -0.28);
    ctx.lineTo(-0.06, -0.28);
    ctx.closePath();
    ctx.fill();
    drawPipeStub(ctx, 0, -0.455, 0, { len: lod >= 1 ? 0.11 : 0.08, width: 0.19, color: PALETTE.steelLight });
    if (variant === 'mk1') {
      // Kohle-Luke hinten links
      drawMetalPanel(ctx, -0.3, 0.19, 0.26, 0.17, { fill: PALETTE.steelDark, radius: 0.025, outline: PALETTE.steelDeep });
      ctx.fillStyle = PALETTE.orangeDark;
      ctx.fillRect(-0.27, 0.215, 0.2, 0.025);
      if (lod >= 1) {
        ctx.fillStyle = PALETTE.steelLight;
        ctx.beginPath();
        ctx.arc(-0.06, 0.275, 0.014, 0, Math.PI * 2);
        ctx.fill();
      }
      // Schornstein hinten rechts
      const cx = 0.26;
      const cy = 0.27;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(cx + 0.012, cy + 0.016, 0.075, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.steelLight;
      ctx.beginPath();
      ctx.arc(cx, cy, 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b0807';
      ctx.beginPath();
      ctx.arc(cx, cy, 0.043, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Mk2: zwei Cyan-Spulen und Blitz
      for (const x of [-0.27, 0.05]) {
        drawMetalPanel(ctx, x, 0.2, 0.22, 0.14, { fill: PALETTE.steelDark, radius: 0.025, outline: PALETTE.steelDeep });
        ctx.fillStyle = alpha(PALETTE.cyan, 0.9);
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 0.02 + i * 0.05, 0.225, 0.028, 0.09);
      }
      ctx.fillStyle = PALETTE.cyanLight;
      ctx.beginPath();
      ctx.moveTo(0.32, 0.18);
      ctx.lineTo(0.27, 0.27);
      ctx.lineTo(0.3, 0.27);
      ctx.lineTo(0.27, 0.35);
      ctx.lineTo(0.34, 0.25);
      ctx.lineTo(0.31, 0.25);
      ctx.closePath();
      ctx.fill();
    }
  });
}

/** Bohrkopf von oben: drei Schneidflügel um eine orange Kappe. */
function drawDrill(ctx: CanvasRenderingContext2D, angle: number, lod: Lod): void {
  ctx.save();
  ctx.rotate(angle);
  const blades = 3;
  for (let i = 0; i < blades; i++) {
    ctx.rotate((Math.PI * 2) / blades);
    const g = ctx.createLinearGradient(0, 0, 0.17, 0);
    g.addColorStop(0, PALETTE.steelLight);
    g.addColorStop(1, shade(PALETTE.steelMid, 0.1));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0.02, -0.03);
    ctx.lineTo(0.18, -0.05);
    ctx.lineTo(0.17, 0.045);
    ctx.lineTo(0.02, 0.05);
    ctx.closePath();
    ctx.fill();
    if (lod >= 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 0.012;
      ctx.stroke();
    }
  }
  ctx.fillStyle = PALETTE.orange;
  ctx.beginPath();
  ctx.arc(0, 0, 0.065, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(-0.02, -0.02, 0.022, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawMiner(ctx: CanvasRenderingContext2D, b: ArtBuilding, time: number, look: MinerLook): void {
  drawBuildingSprite(
    ctx,
    b,
    `miner|${look.variant}`,
    (c, lod) => paintMiner(c, lod, b.dir, look.variant),
    (c, lod) => {
      const seed = seedOf(b);
      // Bohrkopf (dreht sich nur bei Arbeit)
      c.save();
      c.beginPath();
      c.arc(0, 0, 0.2, 0, Math.PI * 2);
      c.clip();
      drawDrill(c, look.working ? time * 8 + seed * 6 : seed * 6, lod);
      c.restore();
      if (lod >= 1) {
        drawStatusLed(c, -0.28, -0.28, look.led, time + seed * 3, { glow: lod >= 2 });
        if (look.variant === 'mk2' && look.working) {
          // Cyan-Spulen leuchten bei Strom
          const p = look.power ?? 1;
          const flick = 0.75 + 0.25 * Math.sin(time * 12 + seed * 9);
          c.save();
          c.rotate(0); // Spulen liegen in lokaler Richtung hinten; Schein reicht als Orientierung
          drawGlow(c, 0, 0, 0.36, PALETTE.cyan, 0.4 * p * flick);
          c.restore();
        }
      }
      if (lod >= 1 && look.working && pxPerTile(c) >= 20) {
        const ps = particlesOf(b.game);
        ps.emitRate(4, () => {
          const a = Math.random() * Math.PI * 2;
          ps.emit('dust', b.center().x + Math.cos(a) * 0.15, b.center().y + Math.sin(a) * 0.15, Math.cos(a) * 0.25, Math.sin(a) * 0.25 - 0.1, 0.5 + Math.random() * 0.4, 0.03, 0.03);
        });
        if (look.variant === 'mk1') {
          const chimney = localToWorld(b, 0.26, 0.27);
          ps.emitRate(1.8, () => ps.emit('smoke', chimney.x, chimney.y, (Math.random() - 0.5) * 0.08, -0.28 - Math.random() * 0.1, 1.5 + Math.random() * 0.8, 0.045, 0.05, Math.random()));
        }
      }
    },
  );
}
