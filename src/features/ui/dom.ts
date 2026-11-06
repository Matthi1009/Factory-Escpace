// Kleine DOM-Helfer (kein Framework).
import { drawItem, type Game, type ItemCounts, type ItemId } from '../../core';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Erster Buchstabe groß (für Gruppen-/Kategorienamen wie 'economy') */
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Zahl deutsch formatiert, z. B. 1.234.567 */
export function fmt(n: number, digits = 0): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Kleines Canvas mit dem Item-Icon (immer dieselbe Optik wie in der Welt, via drawItem). */
export function itemIcon(item: ItemId, size = 22): HTMLCanvasElement {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(size * dpr);
  c.style.width = c.style.height = `${size}px`;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.scale(c.width, c.height);
    drawItem(ctx, item, 0.5, 0.5, 0.8);
  }
  return c;
}

export function itemName(game: Game, id: ItemId): string {
  return game.registries.items.get(id)?.name ?? id;
}

/** „2× Eisenplatte, 1× Zahnrad“ */
export function costText(game: Game, cost: ItemCounts): string {
  const parts = Object.entries(cost).map(([id, n]) => `${n}× ${itemName(game, id)}`);
  return parts.length ? parts.join(', ') : 'kostenlos';
}

/** Führt fn höchstens einmal pro Animationsframe aus (für häufige Events wie inventoryChanged). */
export function rafThrottle(fn: () => void): () => void {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn();
    });
  };
}
