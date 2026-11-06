// Test-Aktionen für das F1-Debugpanel (nur im Dev-Modus), Kategorie 'debug'.
import type { Game } from '../../core';
import type { MonsterManager } from './monsters/MonsterManager';
import { MONSTER_TYPES } from './monsters/types';
import type { WaveSystem } from './monsters/waves';

export function registerDevActions(game: Game, monsters: MonsterManager, waves: WaveSystem): void {
  game.registries.actions.register({
    id: 'environment:debug_wave',
    name: 'Angriffswelle ankündigen (10 Monster)',
    category: 'debug',
    run: () => waves.announce(10),
  });
  game.registries.actions.register({
    id: 'environment:debug_spawn',
    name: '5 Käfer spawnen',
    description: 'Spawnt 5 Käfer in 25 Kacheln Abstand zum Wrack',
    category: 'debug',
    run: (g) => {
      const c = g.wreck?.center() ?? g.world.spawn;
      let n = 0;
      for (let k = 0; k < 200 && n < 5; k++) {
        const a = Math.random() * Math.PI * 2;
        const x = Math.floor(c.x + Math.cos(a) * 25);
        const y = Math.floor(c.y + Math.sin(a) * 25);
        if (!g.world.inBounds(x, y) || g.world.getTerrain(x, y) === 'water' || g.world.getBuilding(x, y)) continue;
        if (!Number.isFinite(monsters.field.get(x, y))) continue;
        monsters.spawn(x, y, monsters.typeAt(x, y));
        n++;
      }
      g.notify(`${n} Käfer gespawnt (insgesamt ${monsters.monsters.length})`, 'info');
    },
  });
  game.registries.actions.register({
    id: 'environment:debug_spawn_all',
    name: 'Jede Mutation einmal spawnen',
    category: 'debug',
    run: (g) => {
      const c = g.wreck?.center() ?? g.world.spawn;
      let k = 0;
      for (const type of MONSTER_TYPES) {
        for (let tries = 0; tries < 100; tries++) {
          const a = ((k + Math.random() * 0.3) / MONSTER_TYPES.length) * Math.PI * 2;
          const x = Math.floor(c.x + Math.cos(a) * 12);
          const y = Math.floor(c.y + Math.sin(a) * 12);
          if (!g.world.inBounds(x, y) || g.world.getTerrain(x, y) === 'water' || g.world.getBuilding(x, y)) continue;
          monsters.spawn(x, y, type);
          break;
        }
        k++;
      }
    },
  });
  game.registries.actions.register({
    id: 'environment:debug_clear',
    name: 'Alle Monster entfernen',
    category: 'debug',
    run: (g) => {
      const n = monsters.monsters.length;
      monsters.monsters.length = 0;
      g.notify(`${n} Monster entfernt`, 'info');
    },
  });
}
