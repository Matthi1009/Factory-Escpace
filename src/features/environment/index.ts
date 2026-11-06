// Feature-Modul 'environment': Umwelt-Simulation, Monster, Verteidigung.
// Regeln: nur in src/features/environment/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'environment:'.
import type { Game } from '../../core';
import { PollutionOverlay } from './overlay';
import { PollutionSimulation } from './simulation';

export function register(game: Game): void {
  const simulation = new PollutionSimulation(game);
  const overlay = new PollutionOverlay(game);
  simulation.onStep = () => overlay.update();
}
