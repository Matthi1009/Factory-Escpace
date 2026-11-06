// Feature-Modul 'progression': Forschung, Geld, Events, Ziele.
// Regeln: nur in src/features/progression/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'progression:'.
import type { Game } from '../../core';
import { Demonstrations } from './demonstrations';
import { registerDevActions } from './devActions';
import { setupEconomy } from './economy';
import { setupResearch } from './research';
import { SdgTracker } from './sdg';

export function register(game: Game): void {
  setupResearch(game);
  const sdg = new SdgTracker(game);
  setupEconomy(game, sdg);
  const demos = new Demonstrations(game, sdg);
  if (import.meta.env.DEV) registerDevActions(game, { demos });
}
