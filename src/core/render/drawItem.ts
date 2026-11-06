// Gemeinsamer Helfer, damit Items überall gleich aussehen (Bänder, Kisten, UI-Canvas …).
import type { ItemDef, ItemId } from '../defs';
import type { Registry } from '../Registry';
import type { Assets } from './Assets';

let items: Registry<ItemDef> | null = null;
let assets: Assets | null = null;

/** @internal Vom Game beim Start gesetzt. */
export function _bindDrawItem(reg: Registry<ItemDef>, a: Assets): void {
  items = reg;
  assets = a;
}

/**
 * Zeichnet ein Item zentriert bei (x, y) mit Durchmesser size – in den Einheiten des aktuellen ctx
 * (in Draw-Hooks also Kacheln, z. B. size = 0.4).
 */
export function drawItem(ctx: CanvasRenderingContext2D, itemId: ItemId, x: number, y: number, size: number): void {
  const def = items?.get(itemId);
  const img = def?.sprite ? assets?.image(def.sprite) : null;
  if (img) {
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    return;
  }
  const r = size / 2;
  ctx.fillStyle = def?.color ?? '#ff00ff';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = size * 0.12;
  ctx.beginPath();
  switch (def?.shape ?? 'circle') {
    case 'square':
      ctx.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
      break;
    case 'diamond':
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      break;
    case 'triangle':
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y + r * 0.8);
      ctx.lineTo(x - r, y + r * 0.8);
      ctx.closePath();
      break;
    default:
      ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
}
