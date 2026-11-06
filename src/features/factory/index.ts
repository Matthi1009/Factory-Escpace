// Feature-Modul 'factory'. Einstiegspunkt – wird von src/main.ts aufgerufen.
// Regeln: nur in src/features/factory/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'factory:'.
import type { Game } from '../../core';
import { registerRecipes } from './recipes';
import { BELT_DEF, drawBeltItems } from './buildings/Belt';
import { MINER_DEF } from './buildings/Miner';
import { MINER_MK2_DEF } from './buildings/MinerMk2';
import { FURNACE_DEF } from './buildings/Furnace';
import { INSERTER_DEF } from './buildings/Inserter';
import { ASSEMBLER_DEF, Assembler } from './buildings/Assembler';
import { CRATE_DEF } from './buildings/Crate';
import { COAL_PLANT_DEF } from './buildings/CoalPlant';
import { DUMP_DEF, DISPOSAL_DEF } from './buildings/WasteBuildings';
import { DATACENTER_DEF } from './buildings/Datacenter';
import { ECO_FURNACE_DEF, SOLAR_PLANT_DEF } from './buildings/EcoBuildings';
import { ROPEWAY_STATION_DEF, drawRopeways } from './buildings/RopewayStation';
import { NUCLEAR_PLANT_DEF } from './buildings/NuclearPlant';
import { openRecipeDialog } from './dialogs/recipeDialog';
import { flushFuelWarnings } from './state';
import { isRefuelable } from './transfer';

export function register(game: Game): void {
  registerRecipes(game);

  // Reihenfolge = Reihenfolge in der Bauleiste
  for (const def of [BELT_DEF, MINER_DEF, MINER_MK2_DEF, FURNACE_DEF, ECO_FURNACE_DEF, INSERTER_DEF, ROPEWAY_STATION_DEF, ASSEMBLER_DEF, CRATE_DEF, COAL_PLANT_DEF, SOLAR_PLANT_DEF, NUCLEAR_PLANT_DEF, DATACENTER_DEF, DUMP_DEF, DISPOSAL_DEF]) {
    game.registries.buildings.register(def);
  }

  // Linksklick auf Gebäude (ohne Bauauswahl)
  game.events.on('buildingClicked', ({ building, button }) => {
    if (button !== 0) return;
    if (building instanceof Assembler) {
      openRecipeDialog(game, building); // Rezept wählen
    } else if (isRefuelable(building)) {
      // Brennstoff aus dem Inventar nachfüllen (Abbaumaschine Mk1, Kohlekraftwerk: Kohle; Atomkraftwerk: Brennstäbe)
      if (building.refuel() === 0) game.notify(`${building.def.name}: ${building.fuelFull() ? 'Brennstoffvorrat ist schon voll' : 'kein passender Brennstoff im Inventar'}`, 'warn');
    }
  });

  // Gesammelte „Maschine ohne Kohle“-Meldungen einmal pro Sekunde ausgeben
  game.onTick((g) => {
    if (g.tickCount % 60 === 0) flushFuelWarnings(g);
  });

  // Items auf Bändern zeichnen
  game.renderer.addDrawHook('items', (ctx, view) => {
    drawRopeways(game, ctx, view);
    drawBeltItems(game, ctx, view);
  });
}
