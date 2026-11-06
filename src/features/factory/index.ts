// Feature-Modul 'factory'. Einstiegspunkt – wird von src/main.ts aufgerufen.
// Regeln: nur in src/features/factory/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'factory:'.
import type { Game } from '../../core';

export function register(game: Game): void {
  // TODO(factory): Inhalte registrieren und Systeme anmelden – siehe docs/tasks/factory.md
  void game;
}
