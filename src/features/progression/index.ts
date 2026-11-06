// Feature-Modul 'progression': Forschung, Geld, Events, Ziele.
// Regeln: nur in src/features/progression/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'progression:'.
import type { Game } from '../../core';
import { setupEconomy } from './economy';
import { setupResearch } from './research';

export function register(game: Game): void {
  setupResearch(game);
  setupEconomy(game);
}
