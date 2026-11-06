// Modul-interne Verträge für Items, die Gebäude „ziehen“ (Greifarm) oder vorab prüfen lassen.
// Der Core kennt nur das Schieben (acceptItem); alles Weitere ist Sache dieses Moduls.
import type { Building, Direction, ItemId } from '../../core';

/** Gebäude, aus denen ein Greifarm Items entnehmen kann. */
export interface Pullable {
  /** Welches Item würde als Nächstes entnommen? Mit `accept` nur eines, das der Greifarm brauchen kann. null = nichts. */
  peekItem(accept?: (item: ItemId) => boolean): ItemId | null;
  /** Entnimmt ein Item (mit `accept` dasselbe wie peekItem(accept)). */
  takeItem(accept?: (item: ItemId) => boolean): ItemId | null;
}

/** Gebäude, die ohne Nebenwirkung sagen können, ob sie ein Item annehmen würden. */
export interface Previewable {
  wouldAccept(item: ItemId, from: Direction): boolean;
}

/** Gebäude, die Kohle aus dem Spieler-Inventar nachfüllen lassen (Linksklick). */
export interface Refuelable {
  refuel(): number;
  /** Ist der Brennstoffvorrat schon voll? (für die richtige Meldung beim Klick) */
  fuelFull(): boolean;
}

export function asPullable(b: Building | null): (Building & Pullable) | null {
  const p = b as Partial<Pullable> | null;
  return b && typeof p?.peekItem === 'function' && typeof p.takeItem === 'function' ? (b as Building & Pullable) : null;
}

/** Würde das Ziel das Item annehmen? Fremde Gebäude: ja, sofern sie überhaupt acceptItem haben. */
export function targetWouldAccept(target: Building, item: ItemId, from: Direction): boolean {
  const t = target as Partial<Previewable>;
  if (typeof t.wouldAccept === 'function') return t.wouldAccept(item, from);
  return typeof target.acceptItem === 'function';
}

export function isRefuelable(b: Building): b is Building & Refuelable {
  return typeof (b as Partial<Refuelable>).refuel === 'function';
}
