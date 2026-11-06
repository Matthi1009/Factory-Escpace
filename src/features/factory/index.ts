// Feature-Modul 'factory'. Einstiegspunkt – wird von src/main.ts aufgerufen.
// Regeln: nur in src/features/factory/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'factory:'.
import type { Game } from '../../core';
import { registerRecipes } from './recipes';
import { BELT_DEF, drawBeltItems } from './buildings/Belt';
import { MINER_DEF, Miner } from './buildings/Miner';
import { FURNACE_DEF } from './buildings/Furnace';

export function register(game: Game): void {
  registerRecipes(game);

  // Reihenfolge = Reihenfolge in der Bauleiste
  game.registries.buildings.register(BELT_DEF);
  game.registries.buildings.register(MINER_DEF);
  game.registries.buildings.register(FURNACE_DEF);

  // Linksklick auf eine Abbaumaschine: Kohle aus dem Inventar nachfüllen
  game.events.on('buildingClicked', ({ building, button }) => {
    if (button !== 0 || !(building instanceof Miner)) return;
    if (building.refuel() === 0) game.notify('Abbaumaschine: keine Kohle im Inventar oder Vorrat voll', 'warn');
  });

  // Items auf Bändern zeichnen
  game.renderer.addDrawHook('items', (ctx, view) => drawBeltItems(game, ctx, view));
}
