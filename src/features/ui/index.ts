// Feature-Modul 'ui'. Einstiegspunkt – wird von src/main.ts aufgerufen.
// Regeln: nur in src/features/ui/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'ui:'.
// Die ui kennt keine anderen Module: sie liest nur Registries, Zustände, Stats, Aktionen und Events des Core.
import type { Game } from '../../core';
import { createHud } from './hud';
import { createInventory } from './inventory';
import { createToasts } from './toasts';
import { createToolbar } from './toolbar';
import { injectStyles } from './styles';
import { closeAllPanels } from './windows';

export function register(game: Game): void {
  injectStyles();
  const toast = createToasts(game);
  createHud(game);
  createToolbar(game, toast);
  createInventory(game);

  // Esc schließt offene Fenster (der Core hebt zusätzlich die Bau-Auswahl auf)
  game.input.onKey('Escape', () => {
    closeAllPanels();
  });
}
