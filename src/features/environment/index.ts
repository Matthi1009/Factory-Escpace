// Feature-Modul 'environment'. Einstiegspunkt – wird von src/main.ts aufgerufen.
// Regeln: nur in src/features/environment/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'environment:'.
import type { Game } from '../../core';

export function register(game: Game): void {
  // TODO(environment): Inhalte registrieren und Systeme anmelden – siehe docs/tasks/environment.md
  void game;
}
