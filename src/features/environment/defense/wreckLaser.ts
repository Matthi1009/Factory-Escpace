// Notfall-Laser des Raumschiff-Wracks (Issue #14): schwache Eigenverteidigung ohne Strom und Munition.
// Reicht gegen ein paar Nachzügler, nicht gegen eine Welle – Mauern und Türme bleiben nötig.
import type { Game } from '../../../core';
import { ENV_CONFIG } from '../config';
import type { Effects } from '../effects';
import type { MonsterManager } from '../monsters/MonsterManager';

const C = ENV_CONFIG.defense.wreckLaser;

export function registerWreckLaser(game: Game, monsters: MonsterManager, effects: Effects): void {
  let cooldown = 0;
  game.onTick(() => {
    if (cooldown > 0) {
      cooldown--;
      return;
    }
    const wreck = game.wreck;
    if (!wreck || wreck.removed || game.over) return;
    const c = wreck.center();
    let target = null;
    let best = C.range * C.range;
    for (const m of monsters.monsters) {
      const d = (m.x - c.x) ** 2 + (m.y - c.y) ** 2;
      if (d <= best) {
        best = d;
        target = m;
      }
    }
    if (!target) return;
    cooldown = C.cooldownTicks;
    effects.tracer(c.x, c.y - 0.4, target.x, target.y, '#ff5a3c');
    monsters.damage(target, C.damage);
  });
}
