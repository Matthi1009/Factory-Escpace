// Feature-Modul 'ui'. Einstiegspunkt – wird von src/main.ts aufgerufen.
// Regeln: nur in src/features/ui/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'ui:'.
// Die ui kennt keine anderen Module: sie liest nur Registries, Zustände, Stats, Aktionen und Events des Core.
import type { Game } from '../../core';
import { createBuildingInfo } from './buildingInfo';
import { createCrafting } from './crafting';
import { createHud } from './hud';
import { createInventory } from './inventory';
import { createResearchWindow } from './researchWindow';
import { createToasts } from './toasts';
import { createToolbar } from './toolbar';
import { createTooltip } from './tooltip';
import { injectStyles } from './styles';
import { closeAllPanels } from './windows';

export function register(game: Game): void {
  injectStyles();
  const toast = createToasts(game);
  createHud(game);
  createToolbar(game, toast);
  createInventory(game);
  createCrafting(game, toast);
  createResearchWindow(game, toast);
  createBuildingInfo(game);
  createTooltip(game);

  // Esc schließt offene Fenster (der Core hebt zusätzlich die Bau-Auswahl auf)
  game.input.onKey('Escape', () => {
    closeAllPanels();
  });
}
