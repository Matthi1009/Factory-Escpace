// Sprite-Cache: Statische Teile eines Gebäudes werden pro Schlüssel (Typ + Richtung + Variante) und Zoomstufe einmal in ein
// Offscreen-Canvas gezeichnet. Pro Frame wird nur noch das Bild plus der animierte Teil gezeichnet.
//
// Wichtig für das Licht: Der Core zeichnet Gebäude mit einem um die Gebäuderichtung gedrehten Canvas. `drawBuildingSprite`
// dreht diese Drehung zurück, damit Schatten und Glanzkanten immer von oben links kommen. Richtungsabhängige Teile zeichnet
// der Painter selbst mit `withDir`.
import { dirAngle, type Direction } from '../direction';
import { lodOf, pxPerTile, type Lod } from './lod';

/** Painter zeichnet im Bildschirm-ausgerichteten Raum, Ursprung = Mitte des Gebäudes, Einheit = 1 Kachel. */
export type Painter = (ctx: CanvasRenderingContext2D, lod: Lod, px: number) => void;

/** Zoomstufen (Pixel pro Kachel), für die Sprites vorgerendert werden */
const BUCKETS = [12, 24, 48, 96, 192];
/** Rand um das Gebäude für den Schatten (in Kacheln) */
const PAD = 0.22;
const MAX_ENTRIES = 700;

const cache = new Map<string, HTMLCanvasElement>();

function bucketFor(px: number): number {
  const want = px * 0.85;
  for (const b of BUCKETS) if (b >= want) return b;
  return BUCKETS[BUCKETS.length - 1]!;
}

/** Zeichnet das gecachte Sprite (Mitte bei (0, 0), Bildschirm-ausgerichtet). */
export function drawSprite(ctx: CanvasRenderingContext2D, key: string, w: number, h: number, painter: Painter): void {
  const bucket = bucketFor(pxPerTile(ctx));
  const k = `${key}@${bucket}`;
  let c = cache.get(k);
  if (!c) {
    if (cache.size >= MAX_ENTRIES) cache.clear();
    c = document.createElement('canvas');
    c.width = Math.ceil((w + PAD * 2) * bucket);
    c.height = Math.ceil((h + PAD * 2) * bucket);
    const g = c.getContext('2d')!;
    g.scale(c.width / (w + PAD * 2), c.height / (h + PAD * 2));
    g.translate(w / 2 + PAD, h / 2 + PAD);
    painter(g, lodOf(bucket), bucket);
    cache.set(k, c);
  }
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(c, -(w / 2 + PAD), -(h / 2 + PAD), w + PAD * 2, h + PAD * 2);
  ctx.imageSmoothingEnabled = prev;
}

export interface SpriteTarget {
  dir: Direction;
  def: { size: { w: number; h: number }; rotatable?: boolean };
}

/**
 * Für draw() von Gebäuden: macht die Drehung des Core rückgängig und zeichnet das gecachte Sprite.
 * `key` muss alles enthalten, was das Aussehen der statischen Teile ändert (Typ, Variante, Richtung).
 * `animated` wird danach im selben, entdrehten Raum gezeichnet (Lichter, Glut, Lüfter …).
 */
export function drawBuildingSprite(
  ctx: CanvasRenderingContext2D,
  b: SpriteTarget,
  key: string,
  painter: Painter,
  animated?: (ctx: CanvasRenderingContext2D, lod: Lod) => void,
): void {
  const rotated = b.def.rotatable !== false;
  ctx.save();
  if (rotated) ctx.rotate(-dirAngle(b.dir));
  drawSprite(ctx, rotated ? `${key}|${b.dir}` : key, b.def.size.w, b.def.size.h, painter);
  animated?.(ctx, lodOf(pxPerTile(ctx)));
  ctx.restore();
}

/** Alle Sprites verwerfen (z. B. nach Änderungen an der Palette). */
export function clearSpriteCache(): void {
  cache.clear();
}
