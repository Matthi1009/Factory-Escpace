// Feature-Modul 'environment': Umwelt-Simulation, Monster, Verteidigung.
// Regeln: nur in src/features/environment/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'environment:'.
import type { Game } from '../../core';
import { Climate } from './climate';
import { registerDevActions } from './devActions';
import { MonsterManager } from './monsters/MonsterManager';
import { PollutionOverlay } from './overlay';
import { PollutionSimulation } from './simulation';
import { TerrainChanger } from './terrain';

export function register(game: Game): void {
  const simulation = new PollutionSimulation(game);
  const overlay = new PollutionOverlay(game);
  simulation.onStep = () => overlay.update();
  new Climate(game);
  const monsters = new MonsterManager(game);
  const terrain = new TerrainChanger(game);
  terrain.onWaterChanged = () => monsters.field.markDirty();
  if (import.meta.env.DEV) registerDevActions(game, monsters);
}
