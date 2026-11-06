// Standard-Optik für Gebäude ohne eigenes draw(): Quadrat in def.color mit Richtungspfeil.
import type { BuildingDef } from './Building';
import { dirAngle, type Direction } from '../direction';

/**
 * Zeichnet das Standard-Gebäude. ctx muss bereits auf die Gebäudemitte verschoben sein (nicht gedreht);
 * gedreht wird hier anhand von dir.
 */
export function drawDefaultBuilding(ctx: CanvasRenderingContext2D, def: BuildingDef, dir: Direction): void {
  const w = def.size.w;
  const h = def.size.h;
  ctx.save();
  if (def.rotatable !== false) ctx.rotate(dirAngle(dir));
  ctx.fillStyle = def.color;
  ctx.fillRect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 0.05;
  ctx.strokeRect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12);
  if (def.rotatable !== false) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 + 0.12);
    ctx.lineTo(0.2, -h / 2 + 0.38);
    ctx.lineTo(-0.2, -h / 2 + 0.38);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
