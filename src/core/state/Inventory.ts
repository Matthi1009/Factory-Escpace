// Spieler-Inventar: Item → Anzahl. Feuert inventoryChanged bei jeder Änderung.
import type { EventBus } from '../EventBus';
import type { ItemCounts, ItemId } from '../defs';

export class Inventory {
  private items = new Map<ItemId, number>();

  constructor(private events: EventBus) {}

  count(item: ItemId): number {
    return this.items.get(item) ?? 0;
  }

  has(item: ItemId, n = 1): boolean {
    return this.count(item) >= n;
  }

  /** Sind alle Mengen vorhanden? */
  hasAll(counts: ItemCounts): boolean {
    return Object.entries(counts).every(([id, n]) => this.count(id) >= n);
  }

  add(item: ItemId, n = 1): void {
    if (n <= 0) return;
    const c = this.count(item) + n;
    this.items.set(item, c);
    this.events.emit('inventoryChanged', { item, count: c, delta: n });
  }

  /** Entfernt n Stück. false (und keine Änderung), wenn nicht genug da ist. */
  remove(item: ItemId, n = 1): boolean {
    if (n <= 0) return true;
    const c = this.count(item);
    if (c < n) return false;
    if (c === n) this.items.delete(item);
    else this.items.set(item, c - n);
    this.events.emit('inventoryChanged', { item, count: c - n, delta: -n });
    return true;
  }

  addAll(counts: ItemCounts): void {
    for (const [id, n] of Object.entries(counts)) this.add(id, n);
  }

  /** Entfernt alle Mengen auf einmal – oder gar nichts, wenn etwas fehlt. */
  removeAll(counts: ItemCounts): boolean {
    if (!this.hasAll(counts)) return false;
    for (const [id, n] of Object.entries(counts)) this.remove(id, n);
    return true;
  }

  /** Alle Einträge mit Anzahl > 0. */
  entries(): [ItemId, number][] {
    return [...this.items.entries()];
  }
}
