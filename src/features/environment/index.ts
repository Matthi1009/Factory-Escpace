// Feature-Modul 'environment': Umwelt-Simulation, Monster, Verteidigung.
// Regeln: nur in src/features/environment/ arbeiten, nur aus '../../core' importieren, IDs mit Präfix 'environment:'.
import type { Game } from '../../core';
import { Climate } from './climate';
import { registerDefense } from './defense';
import { registerDevActions } from './devActions';
import { Effects } from './effects';
import { MonsterManager } from './monsters/MonsterManager';
import { WaveSystem } from './monsters/waves';
import { PollutionOverlay } from './overlay';
import { PollutionSimulation } from './simulation';
import { TerrainChanger } from './terrain';

export function register(game: Game): void {
  const simulation = new PollutionSimulation(game);
  const overlay = new PollutionOverlay(game);
  simulation.onStep = () => overlay.update();
  const climate = new Climate(game);
  const monsters = new MonsterManager(game);
  const terrain = new TerrainChanger(game);
  terrain.onWaterChanged = () => monsters.field.markDirty();
  const effects = new Effects(game);
  monsters.onDeath = (m) => effects.puff(m.x, m.y, m.type.body);
  registerDefense(game, monsters, effects, climate);
  const waves = new WaveSystem(game, monsters);
  if (import.meta.env.DEV) registerDevActions(game, monsters, waves);
}
