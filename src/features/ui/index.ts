// Feature-Modul 'ui'. Einstiegspunkt – wird von src/main.ts aufgerufen.
// Regeln: nur in src/features/ui/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'ui:'.
// Die ui kennt keine anderen Module: sie liest nur Registries, Zustände, Stats, Aktionen und Events des Core.
import type { Game } from '../../core';
import { createActionsMenu } from './actionsMenu';
import { createBuildingInfo } from './buildingInfo';
import { createCrafting } from './crafting';
import { createGameOver } from './gameOver';
import { createHud } from './hud';
import { createInventory } from './inventory';
import { createMenus, showStartScreen } from './menu';
import { createMinimap } from './minimap';
import { createOverview } from './overview';
import { createResearchWindow } from './researchWindow';
import { createToasts } from './toasts';
import { createToolbar } from './toolbar';
import { createTooltip } from './tooltip';
import { injectStyles } from './styles';
import { closeAllPanels } from './windows';

export function register(game: Game): void {
  injectStyles();
  const toast = createToasts(game);
  let openMenu = () => {};
  createHud(game, () => openMenu());
  createToolbar(game, toast);
  createInventory(game);
  createCrafting(game, toast);
  createResearchWindow(game, toast);
  createBuildingInfo(game);
  createTooltip(game);
  createOverview(game);
  createActionsMenu(game);
  createMinimap(game);
  createGameOver(game);
  const { menu, help } = createMenus(game);
  openMenu = () => menu.toggle();

  // Startbildschirm: im Produktions-Build immer, in der Entwicklung nur mit ?menu=1 (sonst bremst er das Testen)
  const wantStart = !import.meta.env.DEV || new URLSearchParams(location.search).has('menu');
  if (wantStart) game.events.once('ready', () => showStartScreen(game, help));

  // Esc schließt offene Fenster (der Core hebt zusätzlich die Bau-Auswahl auf)
  game.input.onKey('Escape', () => {
    closeAllPanels();
  });
}
