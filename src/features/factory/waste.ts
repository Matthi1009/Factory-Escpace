// Müll-Abfluss: Nebenprodukte gehen nach links, rechts und hinten – nie nach vorne.
import { opposite, rotateCCW, rotateCW, type BaseBuilding, type Direction, type ItemId } from '../../core';

/** Items, die als Nebenprodukt gelten (gehen nicht in die normale Ausgabe). */
export const BYPRODUCTS = new Set<ItemId>(['waste', 'nuclear_waste']);

/** Versucht, das erste Item der Box seitlich/hinten loszuwerden. */
export function flushWasteBox(b: BaseBuilding, box: ItemId[]): void {
  const w = box[0];
  if (w === undefined) return;
  const dirs: Direction[] = [rotateCW(b.dir), rotateCCW(b.dir), opposite(b.dir)];
  for (const d of dirs) {
    if (b.pushTo(d, w)) {
      box.shift();
      return;
    }
  }
}
