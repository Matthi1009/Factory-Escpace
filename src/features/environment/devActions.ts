// Test-Aktionen für das F1-Debugpanel (nur im Dev-Modus), Kategorie 'debug'.
import type { Game } from '../../core';
import type { MonsterManager } from './monsters/MonsterManager';

export function registerDevActions(game: Game, monsters: MonsterManager): void {
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
        monsters.spawn(x, y);
        n++;
      }
      g.notify(`${n} Käfer gespawnt (insgesamt ${monsters.monsters.length})`, 'info');
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
