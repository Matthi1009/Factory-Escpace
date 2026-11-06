// Inventar-Fenster (E): alle Items mit Icon und Anzahl, live per inventoryChanged.
import type { Game, ItemId } from '../../core';
import { el, fmt, itemIcon, itemName, rafThrottle } from './dom';
import { Panel } from './windows';

export function createInventory(game: Game): Panel {
  const last = new Map<ItemId, number>();

  const render = () => {
    const entries = game.inventory.entries().filter(([, n]) => n > 0);
    // Reihenfolge der Item-Registry (zentrale Items zuerst, dann Modul-Items)
    const order = new Map(game.registries.items.all().map((d, i) => [d.id, i] as const));
    entries.sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999));

    if (entries.length === 0) {
      panel.body.replaceChildren(el('div', 'fe-ui-empty', 'Das Inventar ist leer. Linksklick auf Erz baut es von Hand ab.'));
    } else {
      const grid = el('div', 'fe-ui-invgrid');
      for (const [id, n] of entries) {
        const row = el('div', 'fe-ui-invitem');
        if (n > (last.get(id) ?? 0)) row.classList.add('bump');
        row.title = id;
        row.append(itemIcon(id, 22), el('span', 'nm', itemName(game, id)), el('span', 'n', fmt(n)));
        grid.appendChild(row);
      }
      panel.body.replaceChildren(grid);
    }
    last.clear();
    for (const [id, n] of entries) last.set(id, n);
  };

  const panel: Panel = new Panel(game.uiRoot, { title: 'Inventar', keyHint: 'E', width: 420, onShow: render });
  const renderSoon = rafThrottle(() => {
    if (panel.isOpen) render();
  });
  game.events.on('inventoryChanged', renderSoon);
  game.input.onKey('KeyE', () => panel.toggle());
  return panel;
}
