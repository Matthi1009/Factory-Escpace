// Meldung, wenn Gebäude zerstört werden (z. B. von Monstern). Mehrere Verluste in kurzer Zeit werden zusammengefasst,
// damit man zerbissene Förderbänder oder Türme überhaupt bemerkt.
import type { Game } from '../../core';
import type { ToastFn } from './toasts';

/** So lange (ms) werden Verluste gesammelt, bevor eine Meldung erscheint */
const COLLECT_MS = 1500;

export function createAlerts(game: Game, toast: ToastFn): void {
  let lost = new Map<string, number>();
  let last = { x: 0, y: 0 };
  let timer = 0;

  const flush = () => {
    timer = 0;
    const total = [...lost.values()].reduce((a, b) => a + b, 0);
    if (total === 0) return;
    const parts = [...lost.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, n]) => (n > 1 ? `${n}× ${name}` : name));
    const more = lost.size > 3 ? ' …' : '';
    toast(total === 1 ? `Zerstört: ${parts[0]} bei ${last.x}|${last.y}` : `${total} Gebäude zerstört: ${parts.join(', ')}${more} (zuletzt bei ${last.x}|${last.y})`, 'warn');
    lost = new Map();
  };

  game.events.on('buildingDestroyed', ({ building }) => {
    if (building === game.wreck || game.over) return; // das Wrack meldet das Game-Over-Screen
    lost.set(building.def.name, (lost.get(building.def.name) ?? 0) + 1);
    last = { x: building.x, y: building.y };
    if (!timer) timer = window.setTimeout(flush, COLLECT_MS);
  });
}
