// Detailstufen (LOD) abhängig von den Bildschirm-Pixeln pro Kachel.
//   0 = weit herausgezoomt: vereinfachte Formen, keine Schrauben/Partikel/kleinen Animationen
//   1 = mittel: Rillen, LEDs, Rauch
//   2 = nah: Schrauben, Funken, Feinheiten
export type Lod = 0 | 1 | 2;

export const LOD_MID_PX = 20;
export const LOD_NEAR_PX = 44;

export function lodOf(pxPerTile: number): Lod {
  return pxPerTile < LOD_MID_PX ? 0 : pxPerTile < LOD_NEAR_PX ? 1 : 2;
}

/** Pixel pro Kachel im aktuellen Canvas (inkl. Zoom und Geräte-Pixel-Verhältnis, unabhängig von der Drehung). */
export function pxPerTile(ctx: CanvasRenderingContext2D): number {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b);
}
